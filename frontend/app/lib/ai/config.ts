// AI Model configurations for CinePilot

export const MODELS = {
  // Language models
  gpt4: {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    maxTokens: 8192,
    costPer1k: 0.03,
  },
  gpt35: {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    maxTokens: 4096,
    costPer1k: 0.002,
  },
  // Vision models
  gpt4v: {
    id: 'gpt-4-vision-preview',
    name: 'GPT-4 Vision',
    provider: 'openai',
    maxTokens: 4096,
    costPer1k: 0.01,
  },
} as const;

// AIML API models (fallback for Indian cinema focus)
export const AIML_MODELS = {
  llama: {
    id: 'llama-3.1-70b',
    name: 'Llama 3.1 70B',
    provider: 'aiml',
    maxTokens: 8192,
    costPer1k: 0,
  },
  mistral: {
    id: 'mistral-7b',
    name: 'Mistral 7B',
    provider: 'aiml',
    maxTokens: 4096,
    costPer1k: 0,
  },
} as const;

// All available models
export const ALL_MODELS = {
  ...MODELS,
  ...AIML_MODELS,
};

// Prompt templates for different tasks
export const PROMPTS = {
  scriptAnalysis: {
    system: `You are an expert screenplay analyst specializing in Tamil and South Indian cinema. 
Analyze the given screenplay and extract:
- Scene breakdowns (INT/EXT, location, time of day)
- Characters (lead, supporting, cameo)
- VFX requirements
- Safety concerns and content warnings
- Props and set requirements
Be thorough and accurate.`,
  },
  shotGeneration: {
    system: `You are a cinematographer expert in Tamil cinema. 
Generate detailed shot lists for scenes considering:
- Director's style (Mani Ratnam, Vetrimaaran, Lokesh Kanagaraj, etc.)
- Scene mood and pacing
- Character emotions
- Technical specifications (lens, angle, movement)
Provide specific, actionable shot descriptions.`,
  },
  budgetGeneration: {
    system: `You are a film production accountant specializing in Tamil cinema budgets.
Generate realistic budget breakdowns based on:
- Production scale (small/medium/large/epic)
- Region (Tamil Nadu, Karnataka, Kerala, etc.)
- Cast requirements
- Location needs
Use current market rates in INR.`,
  },
  scheduleOptimization: {
    system: `You are a film scheduling expert.
Optimize shooting schedules considering:
- Actor availability
- Location clustering
- Time of day requirements
- Equipment needs
- Buffer time
Minimize production costs while maintaining quality.`,
  },
} as const;

// Default model selection based on task
export const DEFAULT_MODEL_FOR_TASK: Record<string, keyof typeof ALL_MODELS> = {
  scriptAnalysis: 'gpt35',
  shotGeneration: 'gpt35',
  budgetGeneration: 'gpt35',
  scheduleOptimization: 'gpt35',
  chat: 'gpt35',
};

// API configuration
export const AI_CONFIG = {
  // OpenAI configuration
  openaiApiKey: process.env.OPENAI_API_KEY || process.env.AIML_API_KEY || '',
  openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  
  // AIML API configuration (preferred for this project)
  aimlApiKey: process.env.AIML_API_KEY || '',
  aimlBaseUrl: process.env.AIML_BASE_URL || 'https://api.aimlapi.com/v1',
  
  // Feature flags
  enableVision: true,
  enableStreaming: true,
  maxRetries: 3,
  timeoutMs: 30000,
};
