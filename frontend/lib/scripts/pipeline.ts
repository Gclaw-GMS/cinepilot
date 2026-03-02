import { prisma } from '@/lib/db';
import { cacheGet, cacheSet, CACHE_TTL, CACHE_KEYS } from '@/lib/redis/cache';
import { uploadFile, STORAGE_PATHS } from '@/lib/storage';
import {
  extractText,
  detectFormat,
  detectLanguage,
  type ExtractionResult,
  type ScriptTextBlock,
} from './extractor';
import {
  jsonCompletion,
  runTask,
  type ChatMessage,
} from '@/lib/ai/service';
import { renderPrompt, PROMPTS, getModelForTask } from '@/lib/ai/config';
import {
  SceneBoundarySchema,
  EntityExtractionSchema,
  CanonicalizationSchema,
  BreakdownSummarySchema,
  QualityScoreSchema,
  type SceneBoundaryResult,
  type EntityExtractionResult,
} from '@/lib/ai/schemas';
import crypto from 'crypto';

// =============================================================================
// Script Processing Pipeline
// Stages: Upload → Extract → Language Detect → Scene Detect → Entity Extract →
//         Canonicalize → Summary → Quality Score
// =============================================================================

export type ScriptStatus =
  | 'uploading'
  | 'extracting'
  | 'extracted'
  | 'analyzing'
  | 'analyzed'
  | 'failed';

export interface UploadResult {
  scriptId: string;
  versionId: string;
  status: ScriptStatus;
}

export interface PipelineProgress {
  stage: string;
  percent: number;
  message: string;
}

// -----------------------------------------------------------------------------
// Stage 0: Upload & Create Script Version
// -----------------------------------------------------------------------------

export async function uploadScript(
  projectId: string,
  file: Buffer,
  filename: string,
  mimeType: string,
  notes?: string | null
): Promise<UploadResult> {
  const format = detectFormat(filename, mimeType);
  if (!format) {
    throw new Error(`Unsupported file format: ${filename}. Supported: PDF, DOCX, FDX, TXT`);
  }

  const contentHash = crypto.createHash('sha256').update(file).digest('hex');

  const existingScript = await prisma.script.findFirst({
    where: { projectId, isActive: true },
    include: { scriptVersions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
  });

  let script;
  let versionNumber = 1;

  if (existingScript) {
    const latestVersion = existingScript.scriptVersions[0];
    if (latestVersion?.rawTextHash === contentHash) {
      return {
        scriptId: existingScript.id,
        versionId: latestVersion.id,
        status: 'analyzed',
      };
    }
    versionNumber = (latestVersion?.versionNumber || 0) + 1;
    script = existingScript;
  } else {
    script = await prisma.script.create({
      data: {
        projectId,
        title: filename.replace(/\.[^/.]+$/, ''),
        filePath: '',
        fileSize: file.length,
        mimeType,
      },
    });
  }

  const storagePath = `${STORAGE_PATHS.scripts(projectId, filename)}/${script.id}/v${versionNumber}`;
  try {
    await uploadFile(storagePath, file, mimeType);
  } catch (s3Err) {
    console.warn('[S3 Upload] Non-fatal – storing locally only:', s3Err instanceof Error ? s3Err.message : s3Err);
  }

  await prisma.script.update({
    where: { id: script.id },
    data: { filePath: storagePath, fileSize: file.length, mimeType, version: versionNumber },
  });

  const version = await prisma.scriptVersion.create({
    data: {
      scriptId: script.id,
      versionNumber,
      rawTextHash: contentHash,
      changeNote: notes || null,
    },
  });

  return { scriptId: script.id, versionId: version.id, status: 'extracting' };
}

// -----------------------------------------------------------------------------
// Stage 1: Text Extraction (Deterministic -- NO AI)
// -----------------------------------------------------------------------------

export async function runExtraction(
  scriptId: string,
  versionId: string,
  file: Buffer,
  filename: string,
  onProgress?: (p: PipelineProgress) => void
): Promise<ExtractionResult> {
  onProgress?.({ stage: 'extraction', percent: 10, message: 'Detecting file format...' });

  const format = detectFormat(filename);
  if (!format) throw new Error(`Unsupported format: ${filename}`);

  onProgress?.({ stage: 'extraction', percent: 30, message: `Extracting text from ${format.toUpperCase()}...` });

  const result = await extractText(file, format);

  if (result.qualityScore < 40) {
    await prisma.script.update({
      where: { id: scriptId },
      data: { content: null },
    });

    const errorMsg = buildExtractionErrorMsg(result);
    throw new Error(errorMsg);
  }

  onProgress?.({ stage: 'extraction', percent: 60, message: 'Persisting text blocks...' });

  await prisma.scriptTextBlock.deleteMany({ where: { scriptId } });
  if (result.blocks.length > 0) {
    await prisma.scriptTextBlock.createMany({
      data: result.blocks.map((b) => ({
        scriptId,
        pageNumber: b.pageNumber,
        lineStart: b.lineStart,
        lineEnd: b.lineEnd,
        blockType: b.blockType,
        rawText: b.rawText,
      })),
    });
  }

  await prisma.script.update({
    where: { id: scriptId },
    data: { content: result.fullText },
  });

  await prisma.scriptVersion.update({
    where: { id: versionId },
    data: { extractionScore: result.qualityScore },
  });

  onProgress?.({ stage: 'extraction', percent: 100, message: 'Text extraction complete' });
  return result;
}

function buildExtractionErrorMsg(result: ExtractionResult): string {
  const issues: string[] = [];
  if (result.qualityDetails.garbledCharRatio > 0.05) {
    issues.push('High ratio of garbled/unreadable characters detected.');
  }
  if (result.qualityDetails.headingPatternRatio === 0) {
    issues.push('No scene heading patterns (INT./EXT.) found.');
  }
  if (result.qualityDetails.avgLineLength < 10) {
    issues.push('Average line length is unusually short.');
  }
  if (result.errors.length > 0) {
    issues.push(...result.errors);
  }

  return `Extraction quality too low (${result.qualityScore}/100). ${issues.join(' ')} Please upload a higher quality file (DOCX or FDX recommended).`;
}

// -----------------------------------------------------------------------------
// Stage 2: Language Detection (Deterministic)
// -----------------------------------------------------------------------------

export function runLanguageDetection(fullText: string) {
  return detectLanguage(fullText);
}

// -----------------------------------------------------------------------------
// Stage 3A: Scene Boundary Detection (AI + Validation)
// -----------------------------------------------------------------------------

export async function detectSceneBoundaries(
  scriptId: string,
  fullText: string,
  lineCount: number,
  onProgress?: (p: PipelineProgress) => void
): Promise<SceneBoundaryResult> {
  onProgress?.({ stage: 'scene_detection', percent: 10, message: 'Preparing text for AI scene detection...' });

  const lines = fullText.split('\n');
  const numberedText = lines
    .map((line, i) => `${i + 1}: ${line}`)
    .join('\n');

  const headingCandidates = lines
    .map((line, i) => ({ lineNumber: i + 1, text: line.trim() }))
    .filter((l) => /^\s*(INT\.|EXT\.|INT\/EXT\.|I\/E\.|உள்|வெளி)/i.test(l.text));

  const textHash = crypto.createHash('md5').update(fullText).digest('hex');
  const cacheKey = CACHE_KEYS.sceneBreakdown(`scenes:${textHash}`);
  const cached = await cacheGet<SceneBoundaryResult>(cacheKey);
  if (cached) {
    onProgress?.({ stage: 'scene_detection', percent: 100, message: 'Scene boundaries loaded from cache' });
    return cached;
  }

  onProgress?.({ stage: 'scene_detection', percent: 40, message: 'Running AI scene boundary detection...' });

  const MAX_CHARS_PER_CHUNK = 60_000;
  let result: SceneBoundaryResult;

  if (numberedText.length <= MAX_CHARS_PER_CHUNK) {
    result = await runTask<SceneBoundaryResult>(
      'script.sceneBoundary',
      {
        scriptText: numberedText,
        headingCandidates: JSON.stringify(headingCandidates),
        lineCount: String(lineCount),
      },
      PROMPTS.scriptParsing.sceneBoundary.system,
      PROMPTS.scriptParsing.sceneBoundary.user,
      SceneBoundarySchema,
      { maxTokens: 8192 }
    );
  } else {
    const chunkCount = Math.ceil(numberedText.length / MAX_CHARS_PER_CHUNK);
    const linesPerChunk = Math.ceil(lines.length / chunkCount);
    const allScenes: SceneBoundaryResult['scenes'] = [];

    for (let c = 0; c < chunkCount; c++) {
      const startLine = c * linesPerChunk;
      const endLine = Math.min((c + 1) * linesPerChunk, lines.length);
      const chunkLines = lines.slice(startLine, endLine);
      const chunkText = chunkLines.map((line, i) => `${startLine + i + 1}: ${line}`).join('\n');
      const chunkCandidates = headingCandidates.filter(
        (h) => h.lineNumber >= startLine + 1 && h.lineNumber <= endLine
      );

      onProgress?.({
        stage: 'scene_detection',
        percent: 40 + Math.round((c / chunkCount) * 40),
        message: `Scene detection chunk ${c + 1}/${chunkCount}...`,
      });

      const chunkResult = await runTask<SceneBoundaryResult>(
        'script.sceneBoundary',
        {
          scriptText: chunkText,
          headingCandidates: JSON.stringify(chunkCandidates),
          lineCount: String(endLine - startLine),
        },
        PROMPTS.scriptParsing.sceneBoundary.system,
        PROMPTS.scriptParsing.sceneBoundary.user,
        SceneBoundarySchema,
        { maxTokens: 8192 }
      );

      allScenes.push(...chunkResult.scenes);
    }

    result = { scenes: allScenes };
  }

  const validated = validateSceneBoundaries(result, lineCount);

  onProgress?.({ stage: 'scene_detection', percent: 80, message: 'Persisting scenes...' });

  await prisma.scene.deleteMany({ where: { scriptId } });
  if (validated.scenes.length > 0) {
    await prisma.scene.createMany({
      data: validated.scenes.map((s) => ({
        scriptId,
        sceneNumber: s.scene_number,
        sceneIndex: s.scene_index,
        headingRaw: s.heading_raw || null,
        intExt: s.int_ext || null,
        timeOfDay: s.time_of_day || null,
        location: s.location_text || null,
        startLine: s.start_line,
        endLine: s.end_line,
        pageStart: s.page_start || null,
        pageEnd: s.page_end || null,
        confidence: s.confidence,
      })),
    });
  }

  await cacheSet(cacheKey, validated, CACHE_TTL.ai);
  onProgress?.({ stage: 'scene_detection', percent: 100, message: `Detected ${validated.scenes.length} scenes` });
  return validated;
}

function validateSceneBoundaries(result: SceneBoundaryResult, lineCount: number): SceneBoundaryResult {
  const sorted = [...result.scenes].sort((a, b) => a.start_line - b.start_line);

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    if (s.start_line < 1) s.start_line = 1;
    if (s.end_line > lineCount) s.end_line = lineCount;
    if (s.start_line > s.end_line) {
      [s.start_line, s.end_line] = [s.end_line, s.start_line];
    }
    s.scene_index = i;
  }

  return { ...result, scenes: sorted };
}

// -----------------------------------------------------------------------------
// Stage 3B: Per-Scene Entity Extraction (AI, Parallelizable)
// -----------------------------------------------------------------------------

export async function extractEntities(
  scriptId: string,
  projectId: string,
  fullText: string,
  scenes: SceneBoundaryResult['scenes'],
  onProgress?: (p: PipelineProgress) => void
): Promise<EntityExtractionResult[]> {
  const lines = fullText.split('\n');
  const results: EntityExtractionResult[] = [];
  const total = scenes.length;

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    onProgress?.({
      stage: 'entity_extraction',
      percent: Math.round(((i + 1) / total) * 100),
      message: `Extracting entities from scene ${scene.scene_number} (${i + 1}/${total})...`,
    });

    const sceneText = lines
      .slice(Math.max(0, scene.start_line - 1), scene.end_line)
      .join('\n');

    const knownCharacters = results.length > 0
      ? [...new Set(results.flatMap((r) => r.characters.map((c) => c.name)))].join(', ')
      : 'None yet';

    const entityResult = await runTask<EntityExtractionResult>(
      'script.entityExtraction',
      {
        sceneText,
        sceneNumber: scene.scene_number,
        knownCharacters,
      },
      PROMPTS.scriptParsing.entityExtraction.system,
      PROMPTS.scriptParsing.entityExtraction.user,
      EntityExtractionSchema,
      { maxTokens: 4096 }
    );

    results.push(entityResult);
  }

  onProgress?.({ stage: 'entity_extraction', percent: 90, message: 'Persisting entities...' });

  const dbScenes = await prisma.scene.findMany({
    where: { scriptId },
    orderBy: { sceneIndex: 'asc' },
  });

  for (let i = 0; i < results.length; i++) {
    const dbScene = dbScenes[i];
    if (!dbScene) continue;
    const er = results[i];

    for (const char of er.characters) {
      let character = await prisma.character.findFirst({
        where: { projectId, name: { equals: char.name, mode: 'insensitive' } },
      });

      if (!character) {
        character = await prisma.character.create({
          data: {
            projectId,
            name: char.name,
            aliases: char.aliases || [],
            roleHint: char.role_hint || null,
          },
        });
      }

      await prisma.sceneCharacter.upsert({
        where: {
          sceneId_characterId: { sceneId: dbScene.id, characterId: character.id },
        },
        update: { confidence: char.confidence },
        create: {
          sceneId: dbScene.id,
          characterId: character.id,
          confidence: char.confidence,
        },
      });
    }

    for (const loc of er.locations) {
      await prisma.sceneLocation.create({
        data: {
          sceneId: dbScene.id,
          name: loc.name,
          details: loc.details || null,
          confidence: loc.confidence,
        },
      });
    }

    for (const prop of er.props) {
      let dbProp = await prisma.prop.findFirst({
        where: { projectId, name: { equals: prop.name, mode: 'insensitive' } },
      });

      if (!dbProp) {
        dbProp = await prisma.prop.create({
          data: { projectId, name: prop.name },
        });
      }

      await prisma.sceneProp.upsert({
        where: {
          sceneId_propId: { sceneId: dbScene.id, propId: dbProp.id },
        },
        update: { confidence: prop.confidence },
        create: {
          sceneId: dbScene.id,
          propId: dbProp.id,
          quantityHint: prop.quantity_hint || null,
          confidence: prop.confidence,
        },
      });
    }

    if (er.vfx) {
      for (const v of er.vfx) {
        await prisma.vfxNote.create({
          data: {
            sceneId: dbScene.id,
            description: v.description,
            vfxType: v.type,
            confidence: v.confidence,
          },
        });
      }
    }

    if (er.safety_notes) {
      for (const sn of er.safety_notes) {
        await prisma.warning.create({
          data: {
            sceneId: dbScene.id,
            warningType: 'safety',
            description: `[${sn.type}] ${sn.description}`,
            severity: sn.severity,
          },
        });
      }
    }
  }

  onProgress?.({ stage: 'entity_extraction', percent: 100, message: 'Entity extraction complete' });
  return results;
}

// -----------------------------------------------------------------------------
// Stage 3C: Global Canonicalization (Deterministic + AI Merge)
// -----------------------------------------------------------------------------

export async function runCanonicalization(
  projectId: string,
  onProgress?: (p: PipelineProgress) => void
) {
  onProgress?.({ stage: 'canonicalization', percent: 20, message: 'Clustering character/location names...' });

  const characters = await prisma.character.findMany({ where: { projectId } });
  const locations = await prisma.sceneLocation.findMany({
    where: { scene: { script: { projectId } } },
    distinct: ['name'],
  });

  if (characters.length < 2 && locations.length < 2) {
    onProgress?.({ stage: 'canonicalization', percent: 100, message: 'No duplicates to merge' });
    return;
  }

  const charClusters = clusterNames(characters.map((c) => ({ id: c.id, name: c.name, aliases: c.aliases })));
  const locClusters = clusterNames(locations.map((l) => ({ id: l.id, name: l.name, aliases: [] })));

  if (charClusters.length === characters.length && locClusters.length === locations.length) {
    onProgress?.({ stage: 'canonicalization', percent: 100, message: 'No duplicates found' });
    return;
  }

  onProgress?.({ stage: 'canonicalization', percent: 50, message: 'AI merging duplicate entities...' });

  const mergeResult = await runTask(
    'script.canonicalization',
    {
      clusters: JSON.stringify({ characters: charClusters, locations: locClusters }),
    },
    PROMPTS.scriptParsing.canonicalization.system,
    PROMPTS.scriptParsing.canonicalization.user,
    CanonicalizationSchema,
    { maxTokens: 4096 }
  );

  for (const cm of mergeResult.characters) {
    const primary = characters.find(
      (c) => c.name.toLowerCase() === cm.canonical.toLowerCase()
    );
    if (!primary) continue;

    const toMerge = characters.filter(
      (c) =>
        c.id !== primary.id &&
        cm.aliases.some((a) => a.toLowerCase() === c.name.toLowerCase())
    );

    if (toMerge.length === 0) continue;

    await prisma.character.update({
      where: { id: primary.id },
      data: { aliases: [...new Set([...primary.aliases, ...cm.aliases])] },
    });

    for (const dup of toMerge) {
      const dupLinks = await prisma.sceneCharacter.findMany({ where: { characterId: dup.id } });
      for (const link of dupLinks) {
        const exists = await prisma.sceneCharacter.findUnique({
          where: { sceneId_characterId: { sceneId: link.sceneId, characterId: primary.id } },
        });
        if (exists) {
          await prisma.sceneCharacter.delete({
            where: { sceneId_characterId: { sceneId: link.sceneId, characterId: dup.id } },
          });
        } else {
          await prisma.sceneCharacter.update({
            where: { sceneId_characterId: { sceneId: link.sceneId, characterId: dup.id } },
            data: { characterId: primary.id },
          });
        }
      }
      await prisma.character.delete({ where: { id: dup.id } }).catch(() => {});
    }
  }

  onProgress?.({ stage: 'canonicalization', percent: 100, message: 'Canonicalization complete' });
}

function clusterNames(items: { id: string; name: string; aliases: string[] }[]) {
  const clusters: { canonical: string; members: string[] }[] = [];
  const used = new Set<string>();

  for (const item of items) {
    if (used.has(item.id)) continue;

    const cluster = [item.name];
    used.add(item.id);

    for (const other of items) {
      if (used.has(other.id)) continue;
      if (
        levenshtein(item.name.toLowerCase(), other.name.toLowerCase()) <= 2 ||
        item.aliases.some((a) => a.toLowerCase() === other.name.toLowerCase())
      ) {
        cluster.push(other.name);
        used.add(other.id);
      }
    }

    clusters.push({ canonical: item.name, members: cluster });
  }

  return clusters;
}

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[b.length][a.length];
}

// -----------------------------------------------------------------------------
// Stage 3D: Breakdown Summary (AI)
// -----------------------------------------------------------------------------

export async function generateBreakdownSummary(
  projectId: string,
  scriptId: string,
  scenes: SceneBoundaryResult['scenes'],
  onProgress?: (p: PipelineProgress) => void
) {
  onProgress?.({ stage: 'summary', percent: 30, message: 'Generating breakdown summary...' });

  const characters = await prisma.character.findMany({ where: { projectId } });
  const props = await prisma.prop.findMany({ where: { projectId } });
  const vfxNotes = await prisma.vfxNote.findMany({
    where: { scene: { scriptId } },
  });
  const warnings = await prisma.warning.findMany({
    where: { scene: { scriptId } },
  });

  const summaryResult = await runTask(
    'script.breakdownSummary',
    {
      sceneCount: String(scenes.length),
      characterList: characters.map((c) => c.name).join(', '),
      locationList: [...new Set(scenes.map((s) => s.location_text).filter(Boolean))].join(', '),
      propsList: props.map((p) => p.name).join(', '),
      vfxCount: String(vfxNotes.length),
      safetyCount: String(warnings.length),
    },
    PROMPTS.scriptParsing.breakdownSummary.system,
    PROMPTS.scriptParsing.breakdownSummary.user,
    BreakdownSummarySchema,
    { maxTokens: 2048 }
  );

  await prisma.aiAnalysis.create({
    data: {
      projectId,
      analysisType: 'breakdown_summary',
      result: summaryResult as any,
      modelUsed: 'gpt-4o-mini',
    },
  });

  onProgress?.({ stage: 'summary', percent: 100, message: 'Breakdown summary complete' });
  return summaryResult;
}

// -----------------------------------------------------------------------------
// Stage 4: Quality Score (AI)
// -----------------------------------------------------------------------------

export async function runQualityScoring(
  projectId: string,
  scriptId: string,
  fullText: string,
  pageCount: number,
  onProgress?: (p: PipelineProgress) => void
) {
  onProgress?.({ stage: 'quality', percent: 30, message: 'Scoring screenplay quality...' });

  const scenes = await prisma.scene.findMany({ where: { scriptId } });
  const lines = fullText.split('\n');

  const sampleIndices = selectSampleIndices(scenes.length, Math.max(3, Math.ceil(scenes.length * 0.1)));
  const sampledScenes = sampleIndices.map((i) => {
    const scene = scenes[i];
    if (!scene) return '';
    const start = (scene.startLine || 1) - 1;
    const end = scene.endLine || lines.length;
    return lines.slice(start, end).join('\n').slice(0, 500);
  }).join('\n---\n');

  const qualityResult = await runTask(
    'script.qualityScore',
    {
      sceneCount: String(scenes.length),
      pageCount: String(pageCount),
      scriptSummary: sampledScenes,
    },
    PROMPTS.scriptParsing.qualityScore.system,
    PROMPTS.scriptParsing.qualityScore.user,
    QualityScoreSchema,
    { maxTokens: 2048 }
  );

  await prisma.aiAnalysis.create({
    data: {
      projectId,
      analysisType: 'quality_score',
      result: qualityResult as any,
      modelUsed: 'gpt-4o',
    },
  });

  onProgress?.({ stage: 'quality', percent: 100, message: 'Quality scoring complete' });
  return qualityResult;
}

function selectSampleIndices(total: number, count: number): number[] {
  if (total <= count) return Array.from({ length: total }, (_, i) => i);
  const step = total / count;
  return Array.from({ length: count }, (_, i) => Math.min(total - 1, Math.round(i * step)));
}

// -----------------------------------------------------------------------------
// Full Pipeline Orchestrator
// -----------------------------------------------------------------------------

export async function runFullPipeline(
  projectId: string,
  scriptId: string,
  versionId: string,
  file: Buffer,
  filename: string,
  onProgress?: (p: PipelineProgress) => void
) {
  try {
    const extraction = await runExtraction(scriptId, versionId, file, filename, onProgress);
    const langInfo = runLanguageDetection(extraction.fullText);

    const sceneBounds = await detectSceneBoundaries(
      scriptId,
      extraction.fullText,
      extraction.lineCount,
      onProgress
    );

    const entities = await extractEntities(
      scriptId,
      projectId,
      extraction.fullText,
      sceneBounds.scenes,
      onProgress
    );

    await runCanonicalization(projectId, onProgress);

    const summary = await generateBreakdownSummary(
      projectId,
      scriptId,
      sceneBounds.scenes,
      onProgress
    );

    const quality = await runQualityScoring(
      projectId,
      scriptId,
      extraction.fullText,
      extraction.pageCount,
      onProgress
    );

    await prisma.script.update({
      where: { id: scriptId },
      data: { isActive: true },
    });

    return {
      extraction,
      language: langInfo,
      scenes: sceneBounds,
      entities,
      summary,
      quality,
    };
  } catch (error) {
    console.error('[Script Pipeline Error]', error);
    throw error;
  }
}
