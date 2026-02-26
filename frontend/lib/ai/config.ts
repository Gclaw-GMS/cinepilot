// =============================================================================
// CinePilot — Centralized AI Configuration
// Single source of truth for all model IDs, prompt templates, and task routing.
// Model IDs from: https://docs.aimlapi.com/api-references/model-database
// =============================================================================

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

export type CostTier = 'premium' | 'standard' | 'budget' | 'image' | 'audio' | 'vision';

export interface ModelConfig {
  slug: string;
  provider: string;
  contextWindow?: number;
  costTier: CostTier;
  description: string;
}

export const MODELS = {
  // --- Text / LLM ---
  gpt4o: {
    slug: 'gpt-4o',
    provider: 'openai',
    contextWindow: 128_000,
    costTier: 'premium' as CostTier,
    description: 'Primary workhorse — script parsing, shots, budget, schedule, censor',
  },
  gpt4oMini: {
    slug: 'gpt-4o-mini',
    provider: 'openai',
    contextWindow: 128_000,
    costTier: 'budget' as CostTier,
    description: 'Simple classifications, summaries, quick labels',
  },
  claude4Sonnet: {
    slug: 'anthropic/claude-sonnet-4',
    provider: 'anthropic',
    contextWindow: 200_000,
    costTier: 'premium' as CostTier,
    description: 'Long scripts, character consistency, plot hole detection',
  },
  claude37Sonnet: {
    slug: 'claude-3-7-sonnet-20250219',
    provider: 'anthropic',
    contextWindow: 200_000,
    costTier: 'premium' as CostTier,
    description: 'Fallback long-context model',
  },
  gemini25Flash: {
    slug: 'google/gemini-2.5-flash',
    provider: 'google',
    contextWindow: 1_000_000,
    costTier: 'budget' as CostTier,
    description: 'Ultra-long scripts, bulk scene processing (1M context)',
  },
  gemini25Pro: {
    slug: 'google/gemini-2.5-pro',
    provider: 'google',
    contextWindow: 1_000_000,
    costTier: 'premium' as CostTier,
    description: 'Complex reasoning with massive context',
  },
  deepseekChat: {
    slug: 'deepseek/deepseek-chat',
    provider: 'deepseek',
    contextWindow: 128_000,
    costTier: 'budget' as CostTier,
    description: 'Cost-effective fallback for simple tasks',
  },
  llama33_70b: {
    slug: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    provider: 'meta',
    contextWindow: 128_000,
    costTier: 'budget' as CostTier,
    description: 'Open-source fallback, simple entity extraction',
  },

  // --- Image Generation ---
  dalle3: {
    slug: 'dall-e-3',
    provider: 'openai',
    costTier: 'image' as CostTier,
    description: 'Storyboard frames (drawing style)',
  },
  fluxPro: {
    slug: 'flux-pro/v1.1',
    provider: 'flux',
    costTier: 'image' as CostTier,
    description: 'High-quality storyboard panels',
  },
  fluxDev: {
    slug: 'flux/dev',
    provider: 'flux',
    costTier: 'image' as CostTier,
    description: 'Development/testing storyboard generation',
  },
  sd35Large: {
    slug: 'stable-diffusion-v35-large',
    provider: 'stability',
    costTier: 'image' as CostTier,
    description: 'LoRA-compatible storyboard (lineart/sketch styles)',
  },
  recraftV3: {
    slug: 'recraft-v3',
    provider: 'recraft',
    costTier: 'image' as CostTier,
    description: 'Clean vector/sketch style storyboards',
  },

  // --- Vision / OCR ---
  mistralOCR: {
    slug: 'mistral/mistral-ocr-latest',
    provider: 'mistral',
    costTier: 'vision' as CostTier,
    description: 'Invoice verification OCR, scanned script extraction',
  },
  gptImage1: {
    slug: 'openai/gpt-image-1',
    provider: 'openai',
    costTier: 'image' as CostTier,
    description: 'Image understanding + generation',
  },

  // --- Speech-to-Text ---
  whisperLarge: {
    slug: '#g1_whisper-large',
    provider: 'openai',
    costTier: 'audio' as CostTier,
    description: 'Audio transcription',
  },
  gpt4oTranscribe: {
    slug: 'openai/gpt-4o-transcribe',
    provider: 'openai',
    costTier: 'audio' as CostTier,
    description: 'High-quality transcription with context',
  },

  // --- Text-to-Speech ---
  tts1HD: {
    slug: 'openai/tts-1-hd',
    provider: 'openai',
    costTier: 'audio' as CostTier,
    description: 'Dialogue coach pronunciation',
  },
} as const;

export type ModelKey = keyof typeof MODELS;

// -----------------------------------------------------------------------------
// TASK → MODEL ROUTING
// Maps each AI task to its preferred model (and optional fallback).
// Change the model for any task by editing this single map.
// -----------------------------------------------------------------------------

export type TaskModelMapping = {
  primary: ModelKey;
  fallback?: ModelKey;
  description: string;
};

export const TASK_MODELS: Record<string, TaskModelMapping> = {
  // N16 — Script Parsing
  'script.sceneBoundary':         { primary: 'gpt4o', fallback: 'claude4Sonnet', description: 'Scene boundary detection' },
  'script.entityExtraction':      { primary: 'gpt4o', fallback: 'gemini25Flash', description: 'Per-scene entity extraction' },
  'script.canonicalization':      { primary: 'gpt4o', description: 'Entity canonicalization merge' },
  'script.breakdownSummary':      { primary: 'gpt4oMini', description: 'Breakdown summary stats' },
  'script.qualityScore':          { primary: 'gpt4o', fallback: 'gpt4oMini', description: 'Screenplay quality scoring' },
  'script.characterConsistency':  { primary: 'claude4Sonnet', fallback: 'gemini25Pro', description: 'Cross-scene character consistency' },
  'script.plotHoles':             { primary: 'claude4Sonnet', fallback: 'gemini25Pro', description: 'Plot hole detection' },

  // N15 — Shot Hub
  'shotHub.characterDict':        { primary: 'gpt4o', description: 'Character dictionary extraction' },
  'shotHub.beatSegmentation':     { primary: 'gpt4o', description: 'Scene → beat segmentation' },
  'shotHub.shotGeneration':       { primary: 'gpt4o', description: 'Beat → shots generation' },
  'shotHub.fillNull':             { primary: 'gpt4o', description: 'Fill missing shot fields' },
  'shotHub.durationEstimation':   { primary: 'gpt4oMini', description: 'Shot duration estimation' },
  'shotHub.lensLighting':         { primary: 'gpt4o', description: 'Lens & lighting recommendation' },
  'shotHub.importanceScoring':    { primary: 'gpt4oMini', description: 'Key shot importance scoring' },
  'shotHub.storyboardGen':        { primary: 'dalle3', fallback: 'fluxPro', description: 'Quick storyboard frame generation' },

  // N13 — Location Scouter
  'location.keywordExtraction':   { primary: 'gpt4oMini', description: 'Scene keyword extraction' },
  'location.explanationBullets':  { primary: 'gpt4o', description: 'Location match explanation' },

  // N14 — Schedule Engine
  'schedule.constraintNormalizer': { primary: 'gpt4o', description: 'Human rules → constraint JSON' },
  'schedule.conflictResolver':     { primary: 'gpt4o', description: 'Infeasible schedule repair' },
  'schedule.narrator':             { primary: 'gpt4oMini', description: 'Schedule summary narrative' },

  // N17 — Budget Engine
  'budget.refinement':             { primary: 'gpt4o', description: 'AI budget refinement' },
  'budget.forecastNarrative':      { primary: 'gpt4oMini', description: 'Forecast variance narrative' },
  'budget.anomalyClassification':  { primary: 'gpt4oMini', description: 'Cost anomaly classification' },
  'budget.reallocationSuggestions': { primary: 'gpt4o', description: 'Budget reallocation suggestions' },
  'budget.invoiceVerification':    { primary: 'mistralOCR', description: 'Invoice OCR + verification' },

  // N18 — Storyboard
  'storyboard.imageGeneration':    { primary: 'dalle3', fallback: 'sd35Large', description: 'Storyboard frame drawing' },
  'storyboard.importanceScoring':  { primary: 'gpt4oMini', description: 'Shot importance for batch priority' },

  // N19 — Censor Board
  'censor.sceneFlagging':          { primary: 'gpt4o', fallback: 'gpt4oMini', description: 'Scene content flagging' },
  'censor.certificateCalibration': { primary: 'gpt4o', description: 'CBFC certificate prediction' },
  'censor.targetOptimizer':        { primary: 'gpt4o', description: 'Cut suggestions for target rating' },
};

export function getModelForTask(task: string): ModelConfig {
  const mapping = TASK_MODELS[task];
  if (!mapping) throw new Error(`Unknown AI task: ${task}`);
  return MODELS[mapping.primary];
}

export function getFallbackModelForTask(task: string): ModelConfig | null {
  const mapping = TASK_MODELS[task];
  if (!mapping?.fallback) return null;
  return MODELS[mapping.fallback];
}

// -----------------------------------------------------------------------------
// PROMPTS
// Every prompt template lives here. Features import and render with variables.
// Template variables use {{variableName}} syntax.
// -----------------------------------------------------------------------------

interface PromptTemplate {
  system: string;
  user: string;
}

interface ImagePromptTemplate {
  positive: string;
  negative: string;
}

export const PROMPTS = {
  // ---------------------------------------------------------------------------
  // Global rules injected into every LLM prompt
  // ---------------------------------------------------------------------------
  global: {
    jsonEnforcement: 'You MUST respond with valid JSON only. No markdown, no code fences, no explanation text outside the JSON object. No extra keys beyond the schema provided.',
    groundingRule: 'Only reference information explicitly present in the provided text. Never invent, hallucinate, or assume details not present in the source material.',
    characterDictRule: 'Use ONLY the character names from the provided known_characters list. Do not invent new characters.',
    tamilCinemaContext: 'This is for South Indian (primarily Tamil) cinema pre-production. Characters may have Tamil names with English/Tanglish spelling variations. Scene headings may use Tamil equivalents of INT/EXT.',
  },

  // ---------------------------------------------------------------------------
  // N16 — Script Parsing & AI Breakdown
  // ---------------------------------------------------------------------------
  scriptParsing: {
    sceneBoundary: {
      system: `You are a screenplay structure analyst specializing in Tamil and South Indian cinema scripts. Your task is to identify scene boundaries with precise line/page references.

{{globalJsonEnforcement}}
{{globalGroundingRule}}
{{globalTamilCinemaContext}}

Rules:
- Scene headings typically start with INT./EXT. or Tamil equivalents (உள்/வெளி).
- Each scene must have sequential, non-overlapping line ranges.
- Confidence score 0.0-1.0 per scene.
- If a heading is ambiguous or missing, infer from context with lower confidence.`,
      user: `Identify all scene boundaries in the following screenplay text. Return strict JSON matching this schema:

{
  "scenes": [
    {
      "scene_index": <number>,
      "scene_number": "<string>",
      "heading_raw": "<original heading text>",
      "int_ext": "INT|EXT|INT/EXT",
      "time_of_day": "DAY|NIGHT|DAWN|DUSK|CONTINUOUS|UNKNOWN",
      "location_text": "<location from heading>",
      "start_line": <number>,
      "end_line": <number>,
      "page_start": <number>,
      "page_end": <number>,
      "confidence": <0.0-1.0>
    }
  ],
  "notes": ["<any parsing warnings>"]
}

SCREENPLAY TEXT:
{{scriptText}}`,
    } satisfies PromptTemplate,

    entityExtraction: {
      system: `You are a production breakdown specialist for South Indian cinema. Extract all production-relevant entities from a single scene.

{{globalJsonEnforcement}}
{{globalGroundingRule}}
{{globalTamilCinemaContext}}

Entity rules:
- Characters: from dialogue labels and action line mentions only. Include aliases (Tamil/English/Tanglish forms).
- Locations: from scene heading or explicit stage directions.
- Props: concrete production-relevant nouns (weapons, vehicles, food, letters, phones).
- VFX: flag as "explicit" (written in script) or "implied" (inferred from action).
- Safety: stunts, fire, water, heights, crowds, animals, children.
- Confidence score per entity.`,
      user: `Extract all entities from this scene. Known characters so far: {{knownCharacters}}

Return strict JSON:
{
  "scene_number": "{{sceneNumber}}",
  "characters": [{ "name": "", "aliases": [], "role_hint": "", "confidence": 0.0 }],
  "locations": [{ "name": "", "details": "", "confidence": 0.0 }],
  "props": [{ "name": "", "quantity_hint": "", "confidence": 0.0 }],
  "vfx": [{ "description": "", "type": "explicit|implied", "confidence": 0.0 }],
  "safety_notes": [{ "type": "", "description": "", "severity": "low|med|high" }]
}

SCENE TEXT:
{{sceneText}}`,
    } satisfies PromptTemplate,

    canonicalization: {
      system: `You are a data normalization specialist. Given clusters of character/location names that may refer to the same entity, pick the canonical name and list all aliases.

{{globalJsonEnforcement}}`,
      user: `Merge these entity clusters into canonical names with aliases.

Clusters:
{{clusters}}

Return strict JSON:
{
  "characters": [{ "canonical": "", "aliases": [], "merge_keys": [] }],
  "locations": [{ "canonical": "", "aliases": [], "merge_keys": [] }]
}`,
    } satisfies PromptTemplate,

    qualityScore: {
      system: `You are a screenplay quality assessor. Rate the screenplay on formatting, pacing, dialogue density, and readability. Provide scores 0-100 per dimension with actionable notes.

{{globalJsonEnforcement}}`,
      user: `Assess the quality of this screenplay. Script has {{sceneCount}} scenes, {{pageCount}} pages.

Summary: {{scriptSummary}}

Return strict JSON:
{
  "scores": { "formatting": 0, "pacing": 0, "dialogue_density": 0, "readability": 0, "overall": 0 },
  "notes": [""],
  "quick_fixes": [""]
}`,
    } satisfies PromptTemplate,

    characterConsistency: {
      system: `You are a script continuity checker for Tamil cinema. Find contradictions across character appearances — personality shifts, timeline errors, factual inconsistencies.

{{globalJsonEnforcement}}
{{globalGroundingRule}}`,
      user: `Check for character consistency issues across scenes.

Character profiles:
{{characterProfiles}}

Scene appearances:
{{sceneAppearances}}

Return strict JSON:
{
  "issues": [
    {
      "character": "",
      "type": "continuity|personality|timeline",
      "severity": "low|med|high",
      "description": "",
      "scene_refs": []
    }
  ]
}`,
    } satisfies PromptTemplate,

    plotHoles: {
      system: `You are a narrative logic analyst. Find plot holes, unresolved threads, and logical inconsistencies in the story.

{{globalJsonEnforcement}}
{{globalGroundingRule}}`,
      user: `Analyze this scene synopsis for plot holes and narrative issues.

Scene synopsis:
{{sceneSynopsis}}

Key turning points:
{{turningPoints}}

Return strict JSON:
{
  "plot_holes": [
    {
      "severity": "low|med|high",
      "description": "",
      "scene_refs": [],
      "suggested_fix": ""
    }
  ]
}`,
    } satisfies PromptTemplate,

    breakdownSummary: {
      system: `You are a production coordinator. Summarize the script breakdown into key production statistics.

{{globalJsonEnforcement}}`,
      user: `Generate a breakdown summary from this data:
Scenes: {{sceneCount}}
Characters: {{characterList}}
Locations: {{locationList}}
Props: {{propsList}}
VFX notes: {{vfxCount}}
Safety warnings: {{safetyCount}}

Return strict JSON:
{
  "total_scenes": 0,
  "unique_characters": 0,
  "unique_locations": 0,
  "key_props": [],
  "vfx_count": 0,
  "safety_warnings_count": 0,
  "estimated_shoot_days": 0,
  "cultural_notes": [],
  "summary": ""
}`,
    } satisfies PromptTemplate,
  },

  // ---------------------------------------------------------------------------
  // N15 — Shot Hub
  // ---------------------------------------------------------------------------
  shotHub: {
    characterDict: {
      system: `You are a character identification specialist for Tamil cinema scripts. Extract candidate character names with all aliases (Tamil names, English names, Tanglish spellings, nicknames).

{{globalJsonEnforcement}}
{{globalGroundingRule}}`,
      user: `Extract all character names and aliases from this screenplay text.

Return strict JSON:
{
  "characters": [
    { "name": "", "aliases": [], "first_appearance_scene": "", "role_hint": "" }
  ]
}

TEXT:
{{scriptText}}`,
    } satisfies PromptTemplate,

    beatSegmentation: {
      system: `You are a scene structure analyst for cinema. Segment a scene into beats — moments where information, emotion, or blocking changes significantly.

{{globalJsonEnforcement}}
{{globalGroundingRule}}
{{globalCharacterDictRule}}`,
      user: `Segment this scene into beats. Known characters: {{knownCharacters}}

Return strict JSON:
{
  "beats": [
    {
      "beat_index": 1,
      "summary": "",
      "characters": [],
      "tone": [],
      "pacing": "slow|medium|fast"
    }
  ]
}

SCENE TEXT (Scene {{sceneNumber}}):
{{sceneText}}`,
    } satisfies PromptTemplate,

    shotGeneration: {
      system: `You are a cinematography assistant for South Indian cinema. Generate 2-8 shots per beat with camera, lens, and lighting recommendations.

{{globalJsonEnforcement}}
{{globalGroundingRule}}
{{globalCharacterDictRule}}

Rules:
- Set unknown values to null with ai_reason_missing explaining why.
- shot_size values: ECU, CU, MCU, MS, MWS, WS, VWS, EWS
- angle values: high, low, eye, dutch, bird, worm, or null
- movement values: static, pan, tilt, dolly, track, crane, handheld, steadicam, drone, or null
- confidence 0.0-1.0 per field group.
- Director style: {{directorStyle}}`,
      user: `Generate shots for these beats. Known characters: {{knownCharacters}}
Scene context: {{sceneContext}}
Available lenses: {{availableLenses}}

Beats:
{{beats}}

Return strict JSON:
{
  "scene_id": "{{sceneId}}",
  "shots": [
    {
      "shot_index": 1,
      "beat_index": 1,
      "shot_text": "",
      "characters": [],
      "camera": { "shot_size": "", "angle": null, "movement": "static" },
      "lens": { "focal_length_mm": null, "lens_type": null },
      "lighting": { "key_style": null, "color_temp": null },
      "duration_estimate_sec": null,
      "confidence": { "camera": 0.0, "lens": 0.0, "lighting": 0.0, "duration": 0.0 },
      "ai_reason_missing": {}
    }
  ]
}`,
    } satisfies PromptTemplate,

    fillNull: {
      system: `You are a cinematography fill-in assistant. For shots with null fields, suggest values with confidence scores. Provide multiple options ranked by confidence when uncertain.

{{globalJsonEnforcement}}
{{globalCharacterDictRule}}`,
      user: `Fill missing fields for these shots. Scene context: {{sceneContext}}
Director style: {{directorStyle}}
Available lenses: {{availableLenses}}

Shots with nulls:
{{shotsWithNulls}}

Return strict JSON:
{
  "suggestions": [
    {
      "shot_id": "",
      "camera": [{ "shot_size": "", "angle": "", "movement": "", "confidence": 0.0 }],
      "lens": [{ "focal_length_mm": 0, "lens_type": "", "confidence": 0.0 }],
      "lighting": [{ "key_style": "", "confidence": 0.0 }],
      "duration": [{ "duration_estimate_sec": 0, "confidence": 0.0 }],
      "notes": ""
    }
  ]
}`,
    } satisfies PromptTemplate,

    durationEstimation: {
      system: `You are a shot timing specialist. Adjust base shot durations using genre pacing, director style, and emotional tone.

{{globalJsonEnforcement}}

Pacing guides:
- Thriller: tighter cuts (0.7-0.85x base)
- Romance/drama: longer compositions (1.1-1.4x base)
- Action: fastest cuts (0.5-0.75x base)
- Director styles: Mani Ratnam = slower composition, Vetrimaaran = raw/longer takes, Lokesh Kanagaraj = precise action beats`,
      user: `Estimate duration for these shots.
Genre: {{genre}}
Director style: {{directorStyle}}
Scene emotional tone: {{emotionalTone}}

Shots:
{{shots}}

Return strict JSON:
{
  "durations": [
    { "shot_id": "", "duration_estimate_sec": 0, "reasoning": "" }
  ]
}`,
    } satisfies PromptTemplate,
  },

  // ---------------------------------------------------------------------------
  // N13 — Location Scouter
  // ---------------------------------------------------------------------------
  locationScouter: {
    keywordExtraction: {
      system: `You are a location requirements analyst for South Indian cinema. Extract location keywords and requirements from scene descriptions.

{{globalJsonEnforcement}}
{{globalGroundingRule}}`,
      user: `Extract location keywords and requirements from this scene.

SCENE:
{{sceneText}}

Return strict JSON:
{
  "keywords": [],
  "terrain_type": "",
  "required_features": [],
  "avoid_features": [],
  "time_of_day": "",
  "season_preference": ""
}`,
    } satisfies PromptTemplate,

    explanationBullets: {
      system: `You are a location scout advisor for South Indian cinema. Generate concise explanations for why a location matches scene requirements, using ONLY computed metrics.

{{globalGroundingRule}}

Never hallucinate landmarks, road conditions, or logistics not in the provided data.`,
      user: `Explain why this location matches the scene requirements.

Location data:
{{locationData}}

Scene requirements:
{{sceneRequirements}}

Computed scores:
{{computedScores}}

Generate 3-5 bullet points explaining the match. Be specific and grounded in the data.`,
    } satisfies PromptTemplate,
  },

  // ---------------------------------------------------------------------------
  // N14 — AI Scheduling Engine
  // ---------------------------------------------------------------------------
  schedule: {
    constraintNormalizer: {
      system: `You are a production scheduling constraint analyst for Tamil cinema. Convert human-readable rules and production mode into strict constraint JSON.

{{globalJsonEnforcement}}

Important:
- Include TFPC (Tamil Film Producers Council) regulations as hard constraints.
- Do NOT assign scenes or decide the schedule — only normalize constraints.
- Hard constraints cannot be violated. Soft constraints can be relaxed with penalty.`,
      user: `Normalize these scheduling inputs into constraint JSON.

Production mode: {{productionMode}}
Human rules: {{humanRules}}
Cast availability: {{castAvailability}}
Location constraints: {{locationConstraints}}
Equipment bookings: {{equipmentBookings}}
Festival/holiday calendar: {{festivalCalendar}}

Return strict JSON:
{
  "hard_constraints": {
    "max_hours_per_day": 0,
    "tfpc_rules": [],
    "cast_blocks": [],
    "location_locks": [],
    "equipment_locks": []
  },
  "soft_constraints": {
    "preferred_sequence": [],
    "weather_preferences": [],
    "cost_optimizations": [],
    "travel_minimization": true,
    "penalties": {}
  }
}`,
    } satisfies PromptTemplate,

    conflictResolver: {
      system: `You are a production schedule conflict resolver. When the solver returns infeasible, propose minimal changes to make the schedule work.

{{globalJsonEnforcement}}

Rules:
- Propose ranked actions: swap scenes, move dates, use alternative location, relax weather threshold, split high-duration day.
- Do not override the solver or bypass hard constraints.
- Each proposal must explain the tradeoff.`,
      user: `The scheduler returned infeasible. Propose repairs.

Infeasibility report:
{{infeasibilityReport}}

Current constraints:
{{constraints}}

Return strict JSON:
{
  "proposals": [
    {
      "rank": 1,
      "action": "swap_scenes|move_date|alt_location|relax_weather|split_day",
      "description": "",
      "scenes_affected": [],
      "tradeoff": "",
      "estimated_impact": ""
    }
  ]
}`,
    } satisfies PromptTemplate,

    narrator: {
      system: `You are a production schedule narrator. Generate a human-readable summary of a finalized schedule for the production team.

Reference computed metrics only. Do not hallucinate logistics claims or road conditions.`,
      user: `Summarize this schedule for the production team.

Schedule data:
{{scheduleData}}

Key metrics:
{{metrics}}

Generate a clear 3-5 paragraph summary covering: why this schedule order, major constraints respected, key tradeoffs, potential risks, and backup recommendations.`,
    } satisfies PromptTemplate,
  },

  // ---------------------------------------------------------------------------
  // N17 — AI Budget Engine
  // ---------------------------------------------------------------------------
  budget: {
    refinement: {
      system: `You are a film production budget analyst specializing in South Indian cinema. Refine budget estimates using script breakdown data.

{{globalJsonEnforcement}}

Rules:
- Only use allowed budget categories.
- Adjust quantities based on actual scene data.
- Add missing production-critical line items.
- Provide cost ranges (low/high) not single numbers.
- Flag risks and questions for the producer.
- No hallucinated entities — only reference scenes/locations/characters from the breakdown.`,
      user: `Refine this budget based on the script breakdown.

Current budget:
{{currentBudget}}

Script breakdown:
{{scriptBreakdown}}

Regional benchmarks:
{{benchmarks}}

Return strict JSON:
{
  "refined_items": [
    {
      "category": "",
      "subcategory": "",
      "description": "",
      "quantity": 0,
      "unit": "",
      "rate_low": 0,
      "rate_high": 0,
      "total_low": 0,
      "total_high": 0,
      "source": "ai",
      "notes": ""
    }
  ],
  "risks": [{ "category": "", "description": "", "severity": "low|med|high" }],
  "questions_for_user": [""]
}`,
    } satisfies PromptTemplate,

    forecastNarrative: {
      system: `You are a production finance analyst. Interpret cost variance data and summarize in plain language for producers.`,
      user: `Interpret this budget variance data.

Planned vs actual:
{{varianceData}}

Generate a clear 2-3 sentence summary. Example: "VFX costs trending 18% above plan due to 3 additional CGI scenes added in revision 2."`,
    } satisfies PromptTemplate,

    anomalyClassification: {
      system: `You are a cost anomaly detector for film production. Classify unusual spending patterns and propose investigation steps.

{{globalJsonEnforcement}}`,
      user: `Classify this cost anomaly.

Anomaly data:
{{anomalyData}}

Return strict JSON:
{
  "classification": "overspend|duplicate|category_mismatch|timing_anomaly|vendor_issue",
  "severity": "low|med|high",
  "description": "",
  "investigation_steps": []
}`,
    } satisfies PromptTemplate,

    reallocationSuggestions: {
      system: `You are a production budget optimizer for South Indian cinema. Generate ranked reallocation suggestions with minimal creative impact.

{{globalJsonEnforcement}}`,
      user: `Suggest budget reallocations to reduce costs.

Current budget: {{currentBudget}}
Overspend areas: {{overspendAreas}}
Schedule data: {{scheduleData}}

Return strict JSON:
{
  "reallocations": [
    {
      "rank": 1,
      "title": "",
      "savings_low": 0,
      "savings_high": 0,
      "impact_risk": "low|med|high",
      "creative_risk": "low|med|high",
      "tradeoff": "",
      "steps": []
    }
  ]
}`,
    } satisfies PromptTemplate,

    invoiceVerification: {
      system: `You are an invoice verification specialist. Extract structured data from invoice images and cross-check against contracted rates.

{{globalJsonEnforcement}}`,
      user: `Verify this invoice against contracted rates and budget.

Contracted rates:
{{contractedRates}}

Budget plan:
{{budgetPlan}}

Extract from the invoice image and return strict JSON:
{
  "extracted": {
    "vendor_name": "",
    "invoice_number": "",
    "invoice_date": "",
    "line_items": [{ "description": "", "quantity": 0, "rate": 0, "amount": 0 }],
    "tax": 0,
    "total": 0
  },
  "checks": {
    "over_contract_rate": [],
    "duplicate_invoice": false,
    "missing_po": false,
    "unexpected_category": []
  },
  "recommended_action": "approve|flag|reject",
  "notes": []
}`,
    } satisfies PromptTemplate,
  },

  // ---------------------------------------------------------------------------
  // N18 — Storyboard Page
  // ---------------------------------------------------------------------------
  storyboard: {
    cleanLineArt: {
      positive: 'Storyboard panel, clean line art drawing, production storyboard sketch, minimal shading, clear readable shapes, strong silhouette, thin linework, limited color accents, no photorealism',
      negative: 'photorealistic, photo, film still, ultra realistic, detailed skin, pores, cinematic bokeh, text, captions, watermark, logo, 3d render, glossy, anime',
    } satisfies ImagePromptTemplate,

    pencilSketch: {
      positive: 'Storyboard panel, pencil sketch drawing, rough graphite lines, light hatching, paper texture subtle, readable blocking, simple forms, no photorealism',
      negative: 'photorealistic, photo, film still, ultra realistic, detailed skin, pores, cinematic bokeh, text, captions, watermark, logo, 3d render, glossy, anime, color',
    } satisfies ImagePromptTemplate,

    markerLine: {
      positive: 'Storyboard panel, ink line drawing with marker fill, bold outlines, flat color blocks, simple shading, readable composition, no photorealism',
      negative: 'photorealistic, photo, film still, ultra realistic, detailed skin, pores, cinematic bokeh, text, captions, watermark, logo, 3d render, glossy, anime, gradient',
    } satisfies ImagePromptTemplate,

    blueprint: {
      positive: 'Storyboard panel, blueprint-style technical sketch, clean lines, minimal fill, composition focused, readable geometry, no photorealism',
      negative: 'photorealistic, photo, film still, ultra realistic, detailed skin, pores, cinematic bokeh, text, captions, watermark, logo, 3d render, glossy, anime, color',
    } satisfies ImagePromptTemplate,
  },

  // ---------------------------------------------------------------------------
  // N19 — Censor Board
  // ---------------------------------------------------------------------------
  censorBoard: {
    sceneFlagging: {
      system: `You are a content sensitivity analyst for Indian cinema (CBFC guidelines). Analyze scene text for sensitive content across categories.

{{globalJsonEnforcement}}
{{globalGroundingRule}}

Rules:
- Use ONLY the provided scene text.
- Evidence snippets must be short (do not leak full script).
- Severity scale: 0 (none) to 5 (extreme/explicit/repeated).
- Context: glorified, condemned, comic, serious.
- Categories: violence, profanity, drugs, sexual_content, hate, child_harm.`,
      user: `Flag sensitive content in this scene.

SCENE (Scene {{sceneNumber}}):
{{sceneText}}

Return strict JSON:
{
  "scene_id": "{{sceneId}}",
  "flags": [
    {
      "category": "violence|profanity|drugs|sexual_content|hate|child_harm",
      "severity": 0,
      "context": "glorified|condemned|comic|serious",
      "evidence": [
        { "line_start": 0, "line_end": 0, "snippet": "" }
      ]
    }
  ]
}`,
    } satisfies PromptTemplate,

    certificateCalibration: {
      system: `You are a CBFC (Central Board of Film Certification) prediction specialist. Predict the likely certificate based on aggregated content flags.

{{globalJsonEnforcement}}

Rules:
- No certainty claims — always provide confidence level.
- Certificate options: U, UA 7+, UA 13+, UA 16+, A, S.
- Identify top drivers and high-risk scenes.
- List uncertainties that could shift the prediction.`,
      user: `Predict the CBFC certificate for this film.

Aggregated flags:
{{aggregatedFlags}}

Deterministic score: {{deterministicScore}}
RKB summary: {{rkbSummary}}

Return strict JSON:
{
  "predicted_certificate": "U|UA 7+|UA 13+|UA 16+|A|S",
  "confidence": "low|med|high",
  "top_drivers": [],
  "high_risk_scenes": [{ "scene_number": "", "reason": "" }],
  "uncertainties": []
}`,
    } satisfies PromptTemplate,

    targetOptimizer: {
      system: `You are a CBFC target optimizer. Suggest minimal edits to reach a target certificate rating with lowest creative impact.

{{globalJsonEnforcement}}

Rules:
- Minimize changes to reach target.
- Estimate severity reduction + certificate shift.
- Rate effort (low/med/high) and creative risk (low/med/high).
- Rank by impact-to-effort ratio.`,
      user: `Suggest edits to achieve target certificate: {{targetCertificate}}

Current prediction: {{currentPrediction}}
Blockers:
{{blockers}}

Return strict JSON:
{
  "target": "{{targetCertificate}}",
  "recommendations": [
    {
      "rank": 1,
      "scene_number": "",
      "issue": "",
      "suggested_change": "",
      "why": "",
      "expected_severity_delta": 0,
      "effort": "low|med|high",
      "creative_risk": "low|med|high",
      "expected_certificate_impact": ""
    }
  ]
}`,
    } satisfies PromptTemplate,
  },
} as const;

// -----------------------------------------------------------------------------
// PROMPT RENDERER
// Replaces {{variableName}} placeholders with provided values.
// Also injects global rules where referenced.
// -----------------------------------------------------------------------------

const GLOBAL_INJECTIONS: Record<string, string> = {
  '{{globalJsonEnforcement}}': PROMPTS.global.jsonEnforcement,
  '{{globalGroundingRule}}': PROMPTS.global.groundingRule,
  '{{globalCharacterDictRule}}': PROMPTS.global.characterDictRule,
  '{{globalTamilCinemaContext}}': PROMPTS.global.tamilCinemaContext,
};

export function renderPrompt(
  template: string,
  variables: Record<string, string> = {}
): string {
  let rendered = template;

  for (const [placeholder, value] of Object.entries(GLOBAL_INJECTIONS)) {
    rendered = rendered.replaceAll(placeholder, value);
  }

  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replaceAll(`{{${key}}}`, value);
  }

  return rendered;
}

export function getPrompt(
  feature: keyof typeof PROMPTS,
  step: string,
  variables: Record<string, string> = {}
): { system: string; user: string } {
  const featurePrompts = PROMPTS[feature] as Record<string, PromptTemplate>;
  const template = featurePrompts[step];
  if (!template) throw new Error(`Unknown prompt: ${feature}.${step}`);

  if ('system' in template && 'user' in template) {
    return {
      system: renderPrompt(template.system, variables),
      user: renderPrompt(template.user, variables),
    };
  }

  throw new Error(`Prompt ${feature}.${step} is not a chat prompt (may be an image prompt)`);
}

export function getImagePrompt(
  step: keyof typeof PROMPTS.storyboard,
  scenePrompt: string
): { positive: string; negative: string } {
  const template = PROMPTS.storyboard[step] as ImagePromptTemplate;
  return {
    positive: `${template.positive}, ${scenePrompt}`,
    negative: template.negative,
  };
}
