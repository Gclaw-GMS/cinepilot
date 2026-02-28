const pdfParse = require('pdf-parse/lib/pdf-parse.js');
import mammoth from 'mammoth';
import { XMLParser } from 'fast-xml-parser';

// =============================================================================
// Deterministic Text Extraction -- NO AI
// Per-format extraction producing ScriptTextBlock arrays.
// =============================================================================

export interface ScriptTextBlock {
  pageNumber: number;
  lineStart: number;
  lineEnd: number;
  blockType: 'heading' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition' | 'unknown';
  rawText: string;
}

export interface ExtractionResult {
  blocks: ScriptTextBlock[];
  fullText: string;
  pageCount: number;
  lineCount: number;
  extractionMethod: 'native' | 'ocr_fallback';
  qualityScore: number;
  qualityDetails: QualityDetails;
  errors: string[];
}

export interface QualityDetails {
  headingPatternRatio: number;
  avgLineLength: number;
  dialoguePatternRatio: number;
  garbledCharRatio: number;
  emptyLineRatio: number;
}

type SupportedFormat = 'pdf' | 'docx' | 'fdx' | 'txt';

export function detectFormat(filename: string, mimeType?: string): SupportedFormat | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf' || mimeType === 'application/pdf') return 'pdf';
  if (ext === 'docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
  if (ext === 'fdx' || ext === 'fadein') return 'fdx';
  if (ext === 'txt' || mimeType === 'text/plain') return 'txt';
  return null;
}

export async function extractText(
  buffer: Buffer,
  format: SupportedFormat
): Promise<ExtractionResult> {
  switch (format) {
    case 'pdf':
      return extractPdf(buffer);
    case 'docx':
      return extractDocx(buffer);
    case 'fdx':
      return extractFdx(buffer);
    case 'txt':
      return extractTxt(buffer);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

// -----------------------------------------------------------------------------
// PDF Extraction
// -----------------------------------------------------------------------------

async function extractPdf(buffer: Buffer): Promise<ExtractionResult> {
  const errors: string[] = [];
  let extractionMethod: 'native' | 'ocr_fallback' = 'native';

  let data;
  try {
    data = await pdfParse(buffer);
  } catch (err) {
    return {
      blocks: [],
      fullText: '',
      pageCount: 0,
      lineCount: 0,
      extractionMethod: 'native',
      qualityScore: 0,
      qualityDetails: { headingPatternRatio: 0, avgLineLength: 0, dialoguePatternRatio: 0, garbledCharRatio: 0, emptyLineRatio: 0 },
      errors: [`PDF parsing failed: ${err instanceof Error ? err.message : String(err)}`],
    };
  }

  const rawText = data.text || '';
  if (rawText.trim().length < 50) {
    errors.push('PDF appears to be scanned or image-based. Text extraction returned minimal content.');
    extractionMethod = 'ocr_fallback';
  }

  const lines = rawText.split('\n');
  const blocks = linesToBlocks(lines, data.numpages || 1);
  const qualityDetails = computeQualityDetails(lines);
  const qualityScore = computeQualityScore(qualityDetails);

  return {
    blocks,
    fullText: rawText,
    pageCount: data.numpages || 1,
    lineCount: lines.length,
    extractionMethod,
    qualityScore,
    qualityDetails,
    errors,
  };
}

// -----------------------------------------------------------------------------
// DOCX Extraction
// -----------------------------------------------------------------------------

async function extractDocx(buffer: Buffer): Promise<ExtractionResult> {
  const errors: string[] = [];

  let result;
  try {
    result = await mammoth.extractRawText({ buffer });
  } catch (err) {
    return {
      blocks: [],
      fullText: '',
      pageCount: 0,
      lineCount: 0,
      extractionMethod: 'native',
      qualityScore: 0,
      qualityDetails: { headingPatternRatio: 0, avgLineLength: 0, dialoguePatternRatio: 0, garbledCharRatio: 0, emptyLineRatio: 0 },
      errors: [`DOCX parsing failed: ${err instanceof Error ? err.message : String(err)}`],
    };
  }

  if (result.messages.length > 0) {
    errors.push(...result.messages.map((m) => `DOCX warning: ${m.message}`));
  }

  const rawText = result.value;
  const lines = rawText.split('\n');
  const estimatedPages = Math.max(1, Math.ceil(lines.length / 55));
  const blocks = linesToBlocks(lines, estimatedPages);
  const qualityDetails = computeQualityDetails(lines);
  const qualityScore = computeQualityScore(qualityDetails);

  return {
    blocks,
    fullText: rawText,
    pageCount: estimatedPages,
    lineCount: lines.length,
    extractionMethod: 'native',
    qualityScore,
    qualityDetails,
    errors,
  };
}

// -----------------------------------------------------------------------------
// FDX (Final Draft XML) Extraction -- Highest Quality
// -----------------------------------------------------------------------------

async function extractFdx(buffer: Buffer): Promise<ExtractionResult> {
  const errors: string[] = [];
  const xmlStr = buffer.toString('utf-8');

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    isArray: (tagName) => ['Paragraph', 'Text'].includes(tagName),
  });

  let parsed;
  try {
    parsed = parser.parse(xmlStr);
  } catch (err) {
    return {
      blocks: [],
      fullText: '',
      pageCount: 0,
      lineCount: 0,
      extractionMethod: 'native',
      qualityScore: 0,
      qualityDetails: { headingPatternRatio: 0, avgLineLength: 0, dialoguePatternRatio: 0, garbledCharRatio: 0, emptyLineRatio: 0 },
      errors: [`FDX parsing failed: ${err instanceof Error ? err.message : String(err)}`],
    };
  }

  const paragraphs = parsed?.FinalDraft?.Content?.Paragraph || [];
  const blocks: ScriptTextBlock[] = [];
  const textLines: string[] = [];
  let lineNum = 1;

  for (const para of paragraphs) {
    const paraType = para['@_Type'] || 'Action';
    const textParts = para.Text || [];
    let lineText = '';
    for (const t of textParts) {
      const content = typeof t === 'string' ? t : t['#text'] || '';
      lineText += content;
    }

    lineText = lineText.trim();
    if (!lineText) continue;

    const blockType = mapFdxType(paraType);
    blocks.push({
      pageNumber: Math.ceil(lineNum / 55),
      lineStart: lineNum,
      lineEnd: lineNum,
      blockType,
      rawText: lineText,
    });
    textLines.push(lineText);
    lineNum++;
  }

  const fullText = textLines.join('\n');
  const estimatedPages = Math.max(1, Math.ceil(textLines.length / 55));
  const qualityDetails = computeQualityDetails(textLines);
  const qualityScore = computeQualityScore(qualityDetails);

  if (qualityScore > 80) {
    // FDX has explicit structure, so bump quality
  }

  return {
    blocks,
    fullText,
    pageCount: estimatedPages,
    lineCount: textLines.length,
    extractionMethod: 'native',
    qualityScore: Math.max(qualityScore, 75),
    qualityDetails,
    errors,
  };
}

function mapFdxType(fdxType: string): ScriptTextBlock['blockType'] {
  const map: Record<string, ScriptTextBlock['blockType']> = {
    'Scene Heading': 'heading',
    'Action': 'action',
    'Character': 'character',
    'Dialogue': 'dialogue',
    'Parenthetical': 'parenthetical',
    'Transition': 'transition',
    'General': 'action',
    'Shot': 'heading',
  };
  return map[fdxType] || 'unknown';
}

// -----------------------------------------------------------------------------
// TXT Extraction
// -----------------------------------------------------------------------------

async function extractTxt(buffer: Buffer): Promise<ExtractionResult> {
  const rawText = buffer.toString('utf-8');
  const lines = rawText.split('\n');
  const estimatedPages = Math.max(1, Math.ceil(lines.length / 55));
  const blocks = linesToBlocks(lines, estimatedPages);
  const qualityDetails = computeQualityDetails(lines);
  const qualityScore = computeQualityScore(qualityDetails);

  return {
    blocks,
    fullText: rawText,
    pageCount: estimatedPages,
    lineCount: lines.length,
    extractionMethod: 'native',
    qualityScore,
    qualityDetails,
    errors: [],
  };
}

// -----------------------------------------------------------------------------
// Shared: Lines → Blocks with Type Classification
// -----------------------------------------------------------------------------

const HEADING_RE = /^\s*(INT\.|EXT\.|INT\/EXT\.|I\/E\.|உள்|வெளி)/i;
const CHARACTER_RE = /^[A-Z\u0B80-\u0BFF][A-Z\u0B80-\u0BFF\s.'()-]{1,40}$/;
const TRANSITION_RE = /^(CUT TO:|FADE IN:|FADE OUT:|DISSOLVE TO:|SMASH CUT|MATCH CUT|JUMP CUT)/i;
const PARENTHETICAL_RE = /^\s*\(.*\)\s*$/;

function classifyLine(line: string): ScriptTextBlock['blockType'] {
  const trimmed = line.trim();
  if (!trimmed) return 'unknown';
  if (HEADING_RE.test(trimmed)) return 'heading';
  if (TRANSITION_RE.test(trimmed)) return 'transition';
  if (PARENTHETICAL_RE.test(trimmed)) return 'parenthetical';
  if (CHARACTER_RE.test(trimmed) && trimmed.length < 50) return 'character';
  return 'action';
}

function linesToBlocks(lines: string[], totalPages: number): ScriptTextBlock[] {
  const blocks: ScriptTextBlock[] = [];
  const linesPerPage = Math.max(1, Math.ceil(lines.length / totalPages));

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const pageNumber = Math.min(totalPages, Math.ceil((i + 1) / linesPerPage));
    const blockType = classifyLine(line);

    blocks.push({
      pageNumber,
      lineStart: i + 1,
      lineEnd: i + 1,
      blockType,
      rawText: line,
    });
  }

  return blocks;
}

// -----------------------------------------------------------------------------
// Extraction Quality Score (0-100)
// Below 40 → "failed" status, never proceed with garbage text.
// -----------------------------------------------------------------------------

function computeQualityDetails(lines: string[]): QualityDetails {
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  const total = nonEmpty.length || 1;

  const headings = nonEmpty.filter((l) => HEADING_RE.test(l.trim())).length;
  const headingPatternRatio = headings / total;

  const totalLen = nonEmpty.reduce((sum, l) => sum + l.trim().length, 0);
  const avgLineLength = totalLen / total;

  const dialoguePatterns = nonEmpty.filter((l) => {
    const trimmed = l.trim();
    return CHARACTER_RE.test(trimmed) || /^[A-Z]{2,}:/.test(trimmed);
  }).length;
  const dialoguePatternRatio = dialoguePatterns / total;

  // Garbled: high ratio of non-printable or replacement chars
  const garbledChars = nonEmpty
    .join('')
    .split('')
    .filter((c) => c === '\ufffd' || c.charCodeAt(0) < 32 && c !== '\n' && c !== '\r' && c !== '\t')
    .length;
  const garbledCharRatio = garbledChars / (totalLen || 1);

  const emptyLineRatio = (lines.length - nonEmpty.length) / (lines.length || 1);

  return {
    headingPatternRatio,
    avgLineLength,
    dialoguePatternRatio,
    garbledCharRatio,
    emptyLineRatio,
  };
}

function computeQualityScore(d: QualityDetails): number {
  let score = 50;

  // Headings present? (screenplays typically have 2-15% headings)
  if (d.headingPatternRatio >= 0.01 && d.headingPatternRatio <= 0.20) score += 15;
  else if (d.headingPatternRatio > 0) score += 5;

  // Average line length reasonable? (30-90 chars typical)
  if (d.avgLineLength >= 20 && d.avgLineLength <= 120) score += 10;
  else if (d.avgLineLength >= 10) score += 3;
  else score -= 15;

  // Dialogue patterns present?
  if (d.dialoguePatternRatio >= 0.05 && d.dialoguePatternRatio <= 0.50) score += 15;
  else if (d.dialoguePatternRatio > 0) score += 5;

  // Low garbled char ratio?
  if (d.garbledCharRatio < 0.01) score += 10;
  else if (d.garbledCharRatio < 0.05) score += 3;
  else score -= 20;

  // Reasonable empty line ratio? (screenplays have lots of spacing)
  if (d.emptyLineRatio >= 0.1 && d.emptyLineRatio <= 0.6) score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// -----------------------------------------------------------------------------
// Language Detection (Tamil / English / Mixed)
// -----------------------------------------------------------------------------

export function detectLanguage(text: string): { primary: string; tamil_ratio: number; english_ratio: number } {
  const chars = [...text.replace(/\s/g, '')];
  const total = chars.length || 1;
  const tamilChars = chars.filter((c) => {
    const code = c.codePointAt(0) || 0;
    return code >= 0x0B80 && code <= 0x0BFF;
  }).length;
  const asciiChars = chars.filter((c) => {
    const code = c.codePointAt(0) || 0;
    return code >= 0x0041 && code <= 0x007A;
  }).length;

  const tamilRatio = tamilChars / total;
  const englishRatio = asciiChars / total;

  let primary = 'english';
  if (tamilRatio > 0.5) primary = 'tamil';
  else if (tamilRatio > 0.1) primary = 'mixed';

  return { primary, tamil_ratio: tamilRatio, english_ratio: englishRatio };
}
