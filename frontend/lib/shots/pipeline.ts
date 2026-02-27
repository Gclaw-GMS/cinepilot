import { prisma } from '@/lib/db';
import { cacheGet, cacheSet, CACHE_TTL, CACHE_KEYS } from '@/lib/redis/cache';
import { runTask } from '@/lib/ai/service';
import { PROMPTS } from '@/lib/ai/config';

// -----------------------------------------------------------------------------
// Mock Data Fallback - Used when AI API is unavailable
// -----------------------------------------------------------------------------

function generateMockBeats(_sceneNumber: string, location: string, _intExt: string): BeatSegmentationResult {
  return {
    beats: [
      { beat_index: 0, summary: `Establish ${location || 'the scene'}`, tone: ['neutral'], characters: [], pacing: 'slow' },
      { beat_index: 1, summary: 'Main action begins', tone: ['engaging'], characters: [], pacing: 'fast' },
      { beat_index: 2, summary: 'Key dialogue moment', tone: ['emotional'], characters: [], pacing: 'medium' },
      { beat_index: 3, summary: 'Scene resolution', tone: ['calm'], characters: [], pacing: 'slow' },
    ],
  };
}

function generateMockShots(beats: BeatSegmentationResult, sceneNumber: string, intExt: string, timeOfDay: string): ShotGenerationResult {
  const shotSizes = ['Wide', 'Medium', 'Close-up', 'Extreme Close-up'];
  const movements = ['Static', 'Pan', 'Tilt', 'Dolly', 'Handheld'];
  const angles = ['Eye Level', 'Low Angle', 'High Angle', 'Dutch Angle'];
  const lenses = [24, 35, 50, 85, 135];
  const keyStyles = ['Natural', 'High Key', 'Low Key', 'Golden Hour', 'Blue Hour'];
  
  let globalShotIdx = 0;
  const shots = beats.beats.flatMap((beat, beatIdx) => {
    const numShots = beat.pacing === 'medium' ? 3 : 2;
    return Array.from({ length: numShots }, () => {
      const currentIdx = globalShotIdx++;
      return {
        shot_index: currentIdx,
        beat_index: beatIdx,
        shot_text: beat.summary,
        characters: beat.characters || [],
        camera: {
          shot_size: shotSizes[currentIdx % shotSizes.length],
          angle: angles[currentIdx % angles.length],
          movement: movements[currentIdx % movements.length],
        },
        lens: {
          focal_length_mm: lenses[currentIdx % lenses.length],
          lens_type: currentIdx % 2 === 0 ? 'Prime' : 'Zoom',
        },
        lighting: {
          key_style: keyStyles[currentIdx % keyStyles.length],
          color_temp: timeOfDay === 'NIGHT' ? '5600K (Daylight)' : '3200K (Tungsten)',
        },
        duration_estimate_sec: 3 + (currentIdx % 4),
        confidence: { camera: 0.8, lens: 0.75, lighting: 0.7, duration: 0.6 },
      };
    });
  });

  return {
    shots,
    scene_id: sceneNumber,
  };
}
import {
  BeatSegmentationSchema,
  ShotGenerationSchema,
  FillNullSchema,
  DurationEstimationSchema,
  type BeatSegmentationResult,
  type ShotGenerationResult,
  type FillNullResult,
  type DurationEstimationResult,
} from '@/lib/ai/schemas';
import crypto from 'crypto';

// =============================================================================
// Shot Hub Pipeline
// Scene → Beats → Shots → Fill Nulls → Duration → Persist
// =============================================================================

export const DIRECTOR_STYLES = {
  maniRatnam: 'Mani Ratnam — Elegant staging, motivated movement, longer takes, classic coverage + lyrical inserts, warm palette, natural-light preference.',
  vetrimaaran: 'Vetrimaaran — Grounded realism, handheld, natural lighting, raw staging, longer observational beats, desaturated look, documentary feel.',
  lokeshKanagaraj: 'Lokesh Kanagaraj — Stylized mass moments, kinetic camera, punchy inserts, dramatic lighting, fast action grammar, high-contrast visuals.',
  custom: '',
} as const;

export type DirectorStyleKey = keyof typeof DIRECTOR_STYLES;

interface ShotPipelineInput {
  sceneId: string;
  directorStyle: DirectorStyleKey;
  customStylePrompt?: string;
  availableLenses?: string[];
  genre?: string;
}

interface ShotPipelineResult {
  beats: BeatSegmentationResult;
  shots: ShotGenerationResult;
  totalDuration: number;
  shotCount: number;
}

// -----------------------------------------------------------------------------
// Full Shot Generation Pipeline for a Single Scene
// -----------------------------------------------------------------------------

export async function generateShotsForScene(
  input: ShotPipelineInput
): Promise<ShotPipelineResult> {
  const scene = await prisma.scene.findUnique({
    where: { id: input.sceneId },
    include: {
      script: { select: { content: true, projectId: true } },
      sceneCharacters: { include: { character: true } },
    },
  });

  if (!scene || !scene.script?.content) {
    throw new Error('Scene not found or script content missing');
  }

  const scriptLines = scene.script.content.split('\n');
  const sceneText = scriptLines
    .slice(Math.max(0, (scene.startLine || 1) - 1), scene.endLine || scriptLines.length)
    .join('\n');

  const knownCharacters = scene.sceneCharacters.map((sc) => sc.character.name).join(', ') || 'Unknown';
  const styleText = input.directorStyle === 'custom'
    ? (input.customStylePrompt || 'Standard coverage')
    : DIRECTOR_STYLES[input.directorStyle];
  const lenses = input.availableLenses?.join(', ') || '24mm, 35mm, 50mm, 85mm';

  const sceneHash = crypto.createHash('md5').update(sceneText).digest('hex');
  const cachePrefix = `${CACHE_KEYS.shotGeneration}:${sceneHash}:${input.directorStyle}`;

  // Stage 1: Beat Segmentation
  const beatCacheKey = `${cachePrefix}:beats`;
  let beats = await cacheGet<BeatSegmentationResult>(beatCacheKey);

  if (!beats) {
    try {
      beats = await runTask<BeatSegmentationResult>(
        'shotHub.beatSegmentation',
        {
          sceneNumber: scene.sceneNumber,
          sceneText,
          knownCharacters,
        },
        PROMPTS.shotHub.beatSegmentation.system,
        PROMPTS.shotHub.beatSegmentation.user,
        BeatSegmentationSchema,
        { maxTokens: 4096 }
      );
      await cacheSet(beatCacheKey, beats, CACHE_TTL.ai);
    } catch (err) {
      console.warn('[Shot Generation] Beat segmentation failed, using mock data:', err);
      beats = generateMockBeats(scene.sceneNumber, scene.location || '', scene.intExt || '');
    }
  }

  // Stage 2: Shot Generation
  const shotCacheKey = `${cachePrefix}:shots`;
  let shots = await cacheGet<ShotGenerationResult>(shotCacheKey);

  if (!shots) {
    try {
      const sceneContext = `${scene.intExt || ''} ${scene.location || ''} - ${scene.timeOfDay || 'DAY'}. ${scene.headingRaw || ''}`;

      shots = await runTask<ShotGenerationResult>(
        'shotHub.shotGeneration',
        {
          sceneId: scene.id,
          sceneContext,
          knownCharacters,
          beats: JSON.stringify(beats.beats),
          directorStyle: styleText,
          availableLenses: lenses,
        },
        PROMPTS.shotHub.shotGeneration.system,
        PROMPTS.shotHub.shotGeneration.user,
        ShotGenerationSchema,
        { maxTokens: 8192 }
      );
      await cacheSet(shotCacheKey, shots, CACHE_TTL.ai);
    } catch (err) {
      console.warn('[Shot Generation] Shot generation failed, using mock data:', err);
      shots = generateMockShots(beats, scene.sceneNumber, scene.intExt || '', scene.timeOfDay || 'DAY');
    }
  }

  // Stage 3: Fill Null Pass
  const shotsWithNulls = shots.shots.filter((s) =>
    !s.camera.shot_size || !s.lens.focal_length_mm || !s.lighting.key_style || !s.duration_estimate_sec
  );

  if (shotsWithNulls.length > 0) {
    try {
      const sceneContext = `${scene.intExt || ''} ${scene.location || ''} - ${scene.timeOfDay || 'DAY'}`;
      const fillResult = await runTask<FillNullResult>(
        'shotHub.fillNull',
        {
          sceneContext,
          directorStyle: styleText,
          availableLenses: lenses,
          shotsWithNulls: JSON.stringify(shotsWithNulls.map((s) => ({
            shot_id: `shot_${s.shot_index}`,
            shot_text: s.shot_text,
            camera: s.camera,
            lens: s.lens,
            lighting: s.lighting,
            duration_estimate_sec: s.duration_estimate_sec,
          }))),
        },
        PROMPTS.shotHub.fillNull.system,
        PROMPTS.shotHub.fillNull.user,
        FillNullSchema,
        { maxTokens: 4096 }
      );

      applyFillSuggestions(shots, fillResult);
    } catch (err) {
      console.warn('[Shot Fill-Null] Failed, proceeding with nulls:', err);
    }
  }

  // Stage 4: Duration Estimation (for shots still missing duration)
  const shotsMissingDuration = shots.shots.filter((s) => !s.duration_estimate_sec);
  if (shotsMissingDuration.length > 0) {
    try {
      const durationResult = await runTask<DurationEstimationResult>(
        'shotHub.durationEstimation',
        {
          genre: input.genre || 'drama',
          directorStyle: styleText,
          emotionalTone: beats.beats.flatMap((b) => b.tone).join(', ') || 'neutral',
          shots: JSON.stringify(shotsMissingDuration.map((s) => ({
            shot_id: `shot_${s.shot_index}`,
            shot_text: s.shot_text,
            shot_size: s.camera.shot_size,
            movement: s.camera.movement,
          }))),
        },
        PROMPTS.shotHub.durationEstimation.system,
        PROMPTS.shotHub.durationEstimation.user,
        DurationEstimationSchema,
        { maxTokens: 2048 }
      );

      for (const d of durationResult.durations) {
        const idx = parseInt(d.shot_id.replace('shot_', ''), 10);
        const shot = shots.shots.find((s) => s.shot_index === idx);
        if (shot && !shot.duration_estimate_sec) {
          shot.duration_estimate_sec = d.duration_estimate_sec;
        }
      }
    } catch (err) {
      console.warn('[Duration Estimation] Failed:', err);
    }
  }

  // Persist to database
  await persistShots(scene.id, shots, beats);

  const totalDuration = shots.shots.reduce(
    (sum, s) => sum + (s.duration_estimate_sec || 3),
    0
  );

  return {
    beats,
    shots,
    totalDuration,
    shotCount: shots.shots.length,
  };
}

function applyFillSuggestions(shots: ShotGenerationResult, fill: FillNullResult) {
  for (const suggestion of fill.suggestions) {
    const idx = parseInt(suggestion.shot_id.replace('shot_', ''), 10);
    const shot = shots.shots.find((s) => s.shot_index === idx);
    if (!shot) continue;

    if (!shot.camera.shot_size && suggestion.camera?.[0]) {
      shot.camera.shot_size = suggestion.camera[0].shot_size;
      shot.camera.angle = suggestion.camera[0].angle || null;
      shot.camera.movement = suggestion.camera[0].movement || null;
    }
    if (!shot.lens.focal_length_mm && suggestion.lens?.[0]) {
      shot.lens.focal_length_mm = suggestion.lens[0].focal_length_mm;
      shot.lens.lens_type = suggestion.lens[0].lens_type || null;
    }
    if (!shot.lighting.key_style && suggestion.lighting?.[0]) {
      shot.lighting.key_style = suggestion.lighting[0].key_style;
    }
    if (!shot.duration_estimate_sec && suggestion.duration?.[0]) {
      shot.duration_estimate_sec = suggestion.duration[0].duration_estimate_sec;
    }
  }
}

async function persistShots(
  sceneId: string,
  shots: ShotGenerationResult,
  beats: BeatSegmentationResult
) {
  await prisma.shot.deleteMany({ where: { sceneId } });

  if (shots.shots.length > 0) {
    await prisma.shot.createMany({
      data: shots.shots.map((s) => ({
        sceneId,
        shotIndex: s.shot_index,
        beatIndex: s.beat_index,
        shotText: s.shot_text,
        characters: s.characters,
        shotSize: s.camera.shot_size,
        cameraAngle: s.camera.angle,
        cameraMovement: s.camera.movement,
        focalLengthMm: s.lens.focal_length_mm,
        lensType: s.lens.lens_type,
        keyStyle: s.lighting.key_style,
        colorTemp: s.lighting.color_temp || null,
        durationEstSec: s.duration_estimate_sec,
        confidenceCamera: s.confidence.camera,
        confidenceLens: s.confidence.lens,
        confidenceLight: s.confidence.lighting,
        confidenceDuration: s.confidence.duration,
      })),
    });
  }
}

// -----------------------------------------------------------------------------
// Generate Shots for All Scenes in a Script
// -----------------------------------------------------------------------------

export async function generateShotsForScript(
  scriptId: string,
  directorStyle: DirectorStyleKey = 'maniRatnam',
  customStylePrompt?: string,
  availableLenses?: string[],
  genre?: string
): Promise<{ sceneResults: Record<string, ShotPipelineResult>; totalShots: number; totalDuration: number }> {
  const scenes = await prisma.scene.findMany({
    where: { scriptId },
    orderBy: { sceneIndex: 'asc' },
  });

  const sceneResults: Record<string, ShotPipelineResult> = {};
  let totalShots = 0;
  let totalDuration = 0;

  for (const scene of scenes) {
    const result = await generateShotsForScene({
      sceneId: scene.id,
      directorStyle,
      customStylePrompt,
      availableLenses,
      genre,
    });
    sceneResults[scene.id] = result;
    totalShots += result.shotCount;
    totalDuration += result.totalDuration;
  }

  return { sceneResults, totalShots, totalDuration };
}

// -----------------------------------------------------------------------------
// Fill Missing Fields for a Single Shot
// -----------------------------------------------------------------------------

export async function fillShotFields(
  shotId: string,
  directorStyle: DirectorStyleKey = 'maniRatnam'
): Promise<void> {
  const shot = await prisma.shot.findUnique({
    where: { id: shotId },
    include: {
      scene: { include: { script: { select: { projectId: true } } } },
    },
  });

  if (!shot) throw new Error('Shot not found');

  const styleText = DIRECTOR_STYLES[directorStyle] || 'Standard coverage';
  const sceneContext = `${shot.scene.intExt || ''} ${shot.scene.location || ''} - ${shot.scene.timeOfDay || 'DAY'}`;

  const fillResult = await runTask<FillNullResult>(
    'shotHub.fillNull',
    {
      sceneContext,
      directorStyle: styleText,
      availableLenses: '24mm, 35mm, 50mm, 85mm',
      shotsWithNulls: JSON.stringify([{
        shot_id: shot.id,
        shot_text: shot.shotText,
        camera: { shot_size: shot.shotSize, angle: shot.cameraAngle, movement: shot.cameraMovement },
        lens: { focal_length_mm: shot.focalLengthMm, lens_type: shot.lensType },
        lighting: { key_style: shot.keyStyle },
        duration_estimate_sec: shot.durationEstSec,
      }]),
    },
    PROMPTS.shotHub.fillNull.system,
    PROMPTS.shotHub.fillNull.user,
    FillNullSchema,
    { maxTokens: 2048 }
  );

  const suggestion = fillResult.suggestions[0];
  if (!suggestion) return;

  const updates: Record<string, unknown> = {};
  if (!shot.shotSize && suggestion.camera?.[0]) {
    updates.shotSize = suggestion.camera[0].shot_size;
    updates.cameraAngle = suggestion.camera[0].angle || null;
    updates.cameraMovement = suggestion.camera[0].movement || null;
  }
  if (!shot.focalLengthMm && suggestion.lens?.[0]) {
    updates.focalLengthMm = suggestion.lens[0].focal_length_mm;
    updates.lensType = suggestion.lens[0].lens_type || null;
  }
  if (!shot.keyStyle && suggestion.lighting?.[0]) {
    updates.keyStyle = suggestion.lighting[0].key_style;
  }
  if (!shot.durationEstSec && suggestion.duration?.[0]) {
    updates.durationEstSec = suggestion.duration[0].duration_estimate_sec;
  }

  if (Object.keys(updates).length > 0) {
    await prisma.shot.update({ where: { id: shotId }, data: updates });

    for (const [field, value] of Object.entries(updates)) {
      await prisma.shotSuggestion.create({
        data: {
          shotId,
          fieldName: field,
          suggestion: value as any,
          confidence: 0.7,
        },
      });
    }
  }
}

// -----------------------------------------------------------------------------
// Update Shot (User Edit)
// -----------------------------------------------------------------------------

export async function updateShot(
  shotId: string,
  updates: {
    shotText?: string;
    shotSize?: string;
    cameraAngle?: string;
    cameraMovement?: string;
    focalLengthMm?: number;
    lensType?: string;
    keyStyle?: string;
    colorTemp?: string;
    durationEstSec?: number;
    isLocked?: boolean;
  }
): Promise<void> {
  await prisma.shot.update({
    where: { id: shotId },
    data: {
      ...updates,
      userEdited: true,
    },
  });
}
