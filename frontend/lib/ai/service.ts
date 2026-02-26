import { z } from 'zod';
import {
  MODELS,
  type ModelKey,
  type ModelConfig,
  getModelForTask,
  getFallbackModelForTask,
  renderPrompt,
} from './config';
import { cacheGet, cacheSet, CACHE_TTL, CACHE_KEYS, checkRateLimit } from '../redis/cache';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
  responseFormat?: { type: 'json_object' | 'text' };
  cacheKey?: string;
  cacheTtl?: number;
  skipCache?: boolean;
  rateLimitKey?: string;
}

export interface ImageGenerationOptions {
  size?: '1024x1024' | '1024x576' | '1024x768' | '512x512';
  quality?: 'standard' | 'hd';
  n?: number;
  style?: 'natural' | 'vivid';
  negativePrompt?: string;
  seed?: number;
  guidanceScale?: number;
}

export interface AiServiceError {
  code: 'rate_limited' | 'api_error' | 'validation_error' | 'timeout' | 'unknown';
  message: string;
  retryable: boolean;
  statusCode?: number;
}

// -----------------------------------------------------------------------------
// Config
// -----------------------------------------------------------------------------

const AIML_BASE_URL = process.env.AIML_BASE_URL || 'https://api.aimlapi.com/v1';
const AIML_API_KEY = process.env.AIML_API_KEY || '';
const MAX_RETRIES = 2;
const REQUEST_TIMEOUT_MS = 120_000;

function getHeaders(): Record<string, string> {
  if (!AIML_API_KEY) {
    throw new Error('AIML_API_KEY is not set. Add it to your .env.local file.');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${AIML_API_KEY}`,
  };
}

// -----------------------------------------------------------------------------
// Chat Completion
// -----------------------------------------------------------------------------

export async function chatCompletion(
  model: ModelConfig | ModelKey,
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<string> {
  const modelConfig = typeof model === 'string' ? MODELS[model] : model;
  const {
    temperature = 0.3,
    maxTokens = 4096,
    topP = 1,
    stream = false,
    responseFormat,
    cacheKey,
    cacheTtl = CACHE_TTL.ai,
    skipCache = false,
    rateLimitKey,
  } = options;

  if (cacheKey && !skipCache) {
    const cached = await cacheGet<string>(cacheKey);
    if (cached) return cached;
  }

  if (rateLimitKey) {
    const limit = await checkRateLimit(rateLimitKey, 30, 60);
    if (!limit.allowed) {
      throw createError('rate_limited', `Rate limited. Try again in ${limit.resetIn}s.`, true);
    }
  }

  const body: Record<string, unknown> = {
    model: modelConfig.slug,
    messages,
    temperature,
    max_tokens: maxTokens,
    top_p: topP,
    stream,
  };

  if (responseFormat) {
    body.response_format = responseFormat;
  }

  let lastError: AiServiceError | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const response = await fetch(`${AIML_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Unknown error');
        const retryable = response.status >= 500 || response.status === 429;

        if (response.status === 429 && attempt < MAX_RETRIES) {
          const retryAfter = Number(response.headers.get('retry-after')) || 2;
          await sleep(retryAfter * 1000);
          continue;
        }

        lastError = createError('api_error', `AIML API ${response.status}: ${errorBody}`, retryable, response.status);

        if (!retryable) throw lastError;
        if (attempt < MAX_RETRIES) {
          await sleep(Math.pow(2, attempt) * 1000);
          continue;
        }
        throw lastError;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content ?? '';

      if (cacheKey) {
        await cacheSet(cacheKey, content, cacheTtl);
      }

      return content;
    } catch (err) {
      if (err && typeof err === 'object' && 'code' in err) throw err;

      if (err instanceof DOMException && err.name === 'AbortError') {
        lastError = createError('timeout', 'Request timed out', true);
      } else {
        lastError = createError('unknown', String(err), attempt < MAX_RETRIES);
      }

      if (attempt < MAX_RETRIES) {
        await sleep(Math.pow(2, attempt) * 1000);
        continue;
      }
    }
  }

  throw lastError ?? createError('unknown', 'All retries exhausted', false);
}

// -----------------------------------------------------------------------------
// Structured JSON Completion (with Zod validation + repair)
// -----------------------------------------------------------------------------

export async function jsonCompletion<T>(
  model: ModelConfig | ModelKey,
  messages: ChatMessage[],
  schema: z.ZodSchema<T>,
  options: ChatCompletionOptions = {}
): Promise<T> {
  const raw = await chatCompletion(model, messages, {
    ...options,
    responseFormat: { type: 'json_object' },
  });

  const cleaned = cleanJsonResponse(raw);
  const parsed = safeJsonParse(cleaned);

  if (parsed === null) {
    throw createError('validation_error', `Invalid JSON response: ${raw.slice(0, 200)}`, false);
  }

  const result = schema.safeParse(parsed);
  if (result.success) return result.data;

  const repairAttempt = await attemptJsonRepair(model, raw, result.error, messages, schema, options);
  if (repairAttempt) return repairAttempt;

  throw createError(
    'validation_error',
    `Schema validation failed: ${result.error.issues.map((i) => i.message).join(', ')}`,
    false
  );
}

async function attemptJsonRepair<T>(
  model: ModelConfig | ModelKey,
  badResponse: string,
  zodError: z.ZodError,
  originalMessages: ChatMessage[],
  schema: z.ZodSchema<T>,
  options: ChatCompletionOptions
): Promise<T | null> {
  const repairMessages: ChatMessage[] = [
    ...originalMessages,
    { role: 'assistant', content: badResponse },
    {
      role: 'user',
      content: `Your previous response had JSON validation errors:\n${zodError.issues
        .map((i) => `- ${i.path.join('.')}: ${i.message}`)
        .join('\n')}\n\nPlease fix the JSON and respond with ONLY the corrected JSON object.`,
    },
  ];

  try {
    const repaired = await chatCompletion(model, repairMessages, {
      ...options,
      cacheKey: undefined,
      responseFormat: { type: 'json_object' },
    });

    const cleaned = cleanJsonResponse(repaired);
    const parsed = safeJsonParse(cleaned);
    if (!parsed) return null;

    const result = schema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// Task-Based Convenience (uses centralized config routing)
// -----------------------------------------------------------------------------

export async function runTask<T>(
  task: string,
  variables: Record<string, string>,
  systemTemplate: string,
  userTemplate: string,
  schema: z.ZodSchema<T>,
  options: ChatCompletionOptions = {}
): Promise<T> {
  const model = getModelForTask(task);
  const system = renderPrompt(systemTemplate, variables);
  const user = renderPrompt(userTemplate, variables);

  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];

  try {
    return await jsonCompletion(model, messages, schema, {
      rateLimitKey: `task:${task}`,
      ...options,
    });
  } catch (err) {
    const fallback = getFallbackModelForTask(task);
    if (fallback && isRetryableError(err)) {
      return await jsonCompletion(fallback, messages, schema, {
        ...options,
        rateLimitKey: `task:${task}:fallback`,
      });
    }
    throw err;
  }
}

export async function runTextTask(
  task: string,
  variables: Record<string, string>,
  systemTemplate: string,
  userTemplate: string,
  options: ChatCompletionOptions = {}
): Promise<string> {
  const model = getModelForTask(task);
  const system = renderPrompt(systemTemplate, variables);
  const user = renderPrompt(userTemplate, variables);

  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];

  try {
    return await chatCompletion(model, messages, {
      rateLimitKey: `task:${task}`,
      ...options,
    });
  } catch (err) {
    const fallback = getFallbackModelForTask(task);
    if (fallback && isRetryableError(err)) {
      return await chatCompletion(fallback, messages, {
        ...options,
        rateLimitKey: `task:${task}:fallback`,
      });
    }
    throw err;
  }
}

// -----------------------------------------------------------------------------
// Image Generation
// -----------------------------------------------------------------------------

export async function generateImage(
  model: ModelConfig | ModelKey,
  prompt: string,
  options: ImageGenerationOptions = {}
): Promise<string[]> {
  const modelConfig = typeof model === 'string' ? MODELS[model] : model;
  const {
    size = '1024x576',
    quality = 'standard',
    n = 1,
    style = 'natural',
    negativePrompt,
    seed,
    guidanceScale,
  } = options;

  const body: Record<string, unknown> = {
    model: modelConfig.slug,
    prompt,
    size,
    quality,
    n,
    style,
  };

  if (negativePrompt) body.negative_prompt = negativePrompt;
  if (seed !== undefined) body.seed = seed;
  if (guidanceScale !== undefined) body.guidance_scale = guidanceScale;

  const response = await fetch(`${AIML_BASE_URL}/images/generations`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error');
    throw createError('api_error', `Image generation failed ${response.status}: ${errorBody}`, response.status >= 500, response.status);
  }

  const data = await response.json();
  return (data.data || []).map((item: { url?: string; b64_json?: string }) => item.url || item.b64_json || '');
}

// -----------------------------------------------------------------------------
// Vision / OCR
// -----------------------------------------------------------------------------

export async function visionAnalysis(
  model: ModelConfig | ModelKey,
  imageUrl: string,
  prompt: string,
  options: ChatCompletionOptions = {}
): Promise<string> {
  const modelConfig = typeof model === 'string' ? MODELS[model] : model;

  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageUrl } },
      ] as unknown as string,
    },
  ];

  return chatCompletion(modelConfig, messages, options);
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function cleanJsonResponse(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  return cleaned.trim();
}

function safeJsonParse(str: string): unknown | null {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function createError(
  code: AiServiceError['code'],
  message: string,
  retryable: boolean,
  statusCode?: number
): AiServiceError {
  return { code, message, retryable, statusCode };
}

function isRetryableError(err: unknown): boolean {
  if (err && typeof err === 'object' && 'retryable' in err) {
    return (err as AiServiceError).retryable;
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// -----------------------------------------------------------------------------
// AI Response Hash (for cache keys)
// -----------------------------------------------------------------------------

export function hashAiInput(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return CACHE_KEYS.aiResponse(Math.abs(hash).toString(36));
}
