import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/ai/service';
import { generateScriptAnalysis, generateBudgetForecast, generateShotSuggestions, generateScheduleOptimization, generateRiskDetection, generateDialogueRefinement } from './mock-data';
import { MODELS } from '@/lib/ai/config';

interface AnalysisRequest {
  action: string;
  text?: string;
  scene_count?: number;
  location_count?: number;
  cast_size?: number;
  duration_days?: number;
  is_outdoor?: boolean;
  is_night_shoots?: boolean;
  budget_total?: number;
}

// Check if AIML API is configured
const AIML_API_KEY = process.env.AIML_API_KEY || '';
const isAIConfigured = AIML_API_KEY && AIML_API_KEY !== 'your-aiml-api-key-here';

// AI-powered analysis functions using AIML API
async function aiScriptAnalysis(data: AnalysisRequest): Promise<any> {
  const prompt = `You are a film production analyst AI. Analyze the following production parameters and provide detailed insights:

Production Parameters:
- Number of scenes: ${data.scene_count || 45}
- Number of locations: ${data.location_count || 8}
- Cast size: ${data.cast_size || 12}
- Duration: ${data.duration_days || 30} shooting days

${data.text ? `\nScript excerpt:\n${data.text.substring(0, 2000)}` : ''}

Provide a detailed analysis in JSON format with these fields:
{
  "summary": "Brief overview of the production analysis",
  "stats": { "scenes": number, "locations": number, "cast": number, "avgSceneLength": number, "dialogueDensity": number, "actionDensity": number },
  "insights": ["insight1", "insight2", "insight3", "insight4"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "sceneBreakdown": { "interior": number, "exterior": number, "day": number, "night": number }
}

Respond with ONLY valid JSON, no additional text.`;

  try {
    const response = await chatCompletion(
      MODELS.gpt4o,
      [
        { role: 'system', content: 'You are a film production expert AI assistant.' },
        { role: 'user', content: prompt }
      ],
      { responseFormat: { type: 'json_object' }, temperature: 0.3, maxTokens: 2000 }
    );
    return JSON.parse(response);
  } catch (error) {
    console.error('AI Script Analysis failed, using fallback:', error);
    return generateScriptAnalysis(data);
  }
}

async function aiBudgetForecast(data: AnalysisRequest): Promise<any> {
  const prompt = `You are a film budget analyst. Estimate production costs for a South Indian film with:

Parameters:
- Scenes: ${data.scene_count || 45}
- Shooting days: ${data.duration_days || 30}
- Locations: ${data.location_count || 8}
- Cast size: ${data.cast_size || 12}

Provide detailed budget breakdown in JSON:
{
  "estimatedTotal": number,
  "breakdown": {
    "production": { "amount": number, "percentage": number, "items": [{ "name": string, "amount": number }] },
    "postProduction": { "amount": number, "percentage": number, "items": [{ "name": string, "amount": number }] },
    "talent": { "amount": number, "percentage": number }
  },
  "recommendations": ["rec1", "rec2", "rec3"],
  "contingencies": { "recommended": number, "minimum": number }
}

Respond with ONLY valid JSON.`;

  try {
    const response = await chatCompletion(
      MODELS.gpt4o,
      [
        { role: 'system', content: 'You are a film budget expert with knowledge of South Indian film production costs.' },
        { role: 'user', content: prompt }
      ],
      { responseFormat: { type: 'json_object' }, temperature: 0.2, maxTokens: 2000 }
    );
    return JSON.parse(response);
  } catch (error) {
    console.error('AI Budget Forecast failed, using fallback:', error);
    return generateBudgetForecast(data);
  }
}

async function aiShotSuggestions(data: AnalysisRequest): Promise<any> {
  const prompt = `You are a cinematographer AI. Recommend shots for:

Production:
- Scenes: ${data.scene_count || 45}
- Outdoor: ${data.is_outdoor !== false ? 'Yes' : 'No'}
- Night shoots: ${data.is_night_shoots !== false ? 'Yes' : 'No'}

Provide shot recommendations in JSON:
{
  "totalShots": number,
  "shotTypeBreakdown": { "wide": number, "medium": number, "closeup": number, "insert": number },
  "recommendations": ["rec1", "rec2", "rec3", "rec4"],
  "equipment": [{ "category": string, "items": [string, string, string] }],
  "estimatedDuration": "string"
}

Respond with ONLY valid JSON.`;

  try {
    const response = await chatCompletion(
      MODELS.gpt4o,
      [
        { role: 'system', content: 'You are an experienced cinematographer familiar with South Indian film production.' },
        { role: 'user', content: prompt }
      ],
      { responseFormat: { type: 'json_object' }, temperature: 0.3, maxTokens: 1500 }
    );
    return JSON.parse(response);
  } catch (error) {
    console.error('AI Shot Suggestions failed, using fallback:', error);
    return generateShotSuggestions(data);
  }
}

async function aiScheduleOptimization(data: AnalysisRequest): Promise<any> {
  const prompt = `You are a film scheduling expert. Optimize the schedule for:

Parameters:
- Scenes: ${data.scene_count || 45}
- Locations: ${data.location_count || 8}
- Days: ${data.duration_days || 30}
- Outdoor: ${data.is_outdoor !== false ? 'Yes' : 'No'}
- Night shoots: ${data.is_night_shoots !== false ? 'Yes' : 'No'}

Provide optimized schedule in JSON:
{
  "suggestedDays": number,
  "currentDays": number,
  "savings": number,
  "strategy": { "type": string, "description": string },
  "schedule": [{ "phase": string, "focus": string, "scenes": number }],
  "recommendations": ["rec1", "rec2", "rec3", "rec4"],
  "constraints": { "actorAvailability": string, "equipment": string, "weather": string }
}

Respond with ONLY valid JSON.`;

  try {
    const response = await chatCompletion(
      MODELS.gpt4o,
      [
        { role: 'system', content: 'You are a line producer with 20+ years experience in South Indian film schedules.' },
        { role: 'user', content: prompt }
      ],
      { responseFormat: { type: 'json_object' }, temperature: 0.2, maxTokens: 1500 }
    );
    return JSON.parse(response);
  } catch (error) {
    console.error('AI Schedule Optimization failed, using fallback:', error);
    return generateScheduleOptimization(data);
  }
}

async function aiRiskDetection(data: AnalysisRequest): Promise<any> {
  const prompt = `You are a production risk analyst. Identify risks for:

Production:
- Scenes: ${data.scene_count || 45}
- Outdoor: ${data.is_outdoor !== false ? 'Yes' : 'No'}
- Night shoots: ${data.is_night_shoots !== false ? 'Yes' : 'No'}
- Duration: ${data.duration_days || 30} days

Provide risk analysis in JSON:
{
  "riskScore": number (0-100),
  "risks": [{ "category": string, "severity": "high|medium|low", "probability": number, "description": string, "mitigation": string }],
  "overallAssessment": string
}

Sort risks by severity (high first). Respond with ONLY valid JSON.`;

  try {
    const response = await chatCompletion(
      MODELS.gpt4o,
      [
        { role: 'system', content: 'You are a film production risk assessment expert.' },
        { role: 'user', content: prompt }
      ],
      { responseFormat: { type: 'json_object' }, temperature: 0.2, maxTokens: 1500 }
    );
    return JSON.parse(response);
  } catch (error) {
    console.error('AI Risk Detection failed, using fallback:', error);
    return generateRiskDetection(data);
  }
}

async function aiDialogueRefinement(data: AnalysisRequest): Promise<any> {
  const text = data.text || "Sample dialogue text for analysis";
  
  const prompt = `You are a screenplay dialogue expert. Analyze and improve this dialogue:

${text.substring(0, 1500)}

Provide suggestions in JSON:
{
  "suggestions": [{ "type": string, "original": string, "suggested": string, "impact": string }],
  "statistics": { "wordCount": number, "dialoguePercentage": number, "avgLineLength": number, "emotionalRange": string },
  "recommendations": ["rec1", "rec2", "rec3"]
}

Respond with ONLY valid JSON.`;

  try {
    const response = await chatCompletion(
      MODELS.gpt4o,
      [
        { role: 'system', content: 'You are a dialogue coach and screenplay consultant expert in Tamil and Telugu cinema.' },
        { role: 'user', content: prompt }
      ],
      { responseFormat: { type: 'json_object' }, temperature: 0.4, maxTokens: 1500 }
    );
    return JSON.parse(response);
  } catch (error) {
    console.error('AI Dialogue Refinement failed, using fallback:', error);
    return generateDialogueRefinement(data);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: AnalysisRequest = await req.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Missing required field: action' },
        { status: 400 }
      );
    }

    let result;
    let useAI = isAIConfigured;

    // Try AI-powered analysis if API key is configured
    if (useAI) {
      try {
        switch (action) {
          case 'script-analyzer':
            result = await aiScriptAnalysis(body);
            break;
          case 'budget-forecast':
            result = await aiBudgetForecast(body);
            break;
          case 'shot-suggest':
            result = await aiShotSuggestions(body);
            break;
          case 'schedule':
            result = await aiScheduleOptimization(body);
            break;
          case 'risk-detect':
            result = await aiRiskDetection(body);
            break;
          case 'dialogue':
            result = await aiDialogueRefinement(body);
            break;
          default:
            return NextResponse.json(
              { error: `Unknown action: ${action}` },
              { status: 400 }
            );
        }
      } catch (aiError) {
        console.error('AI analysis failed, falling back to mock data:', aiError);
        useAI = false;
      }
    }

    // Fallback to mock data if AI not available or failed
    if (!useAI || !result) {
      switch (action) {
        case 'script-analyzer':
          result = generateScriptAnalysis(body);
          break;
        case 'budget-forecast':
          result = generateBudgetForecast(body);
          break;
        case 'shot-suggest':
          result = generateShotSuggestions(body);
          break;
        case 'schedule':
          result = generateScheduleOptimization(body);
          break;
        case 'risk-detect':
          result = generateRiskDetection(body);
          break;
        case 'dialogue':
          result = generateDialogueRefinement(body);
          break;
        default:
          return NextResponse.json(
            { error: `Unknown action: ${action}` },
            { status: 400 }
          );
      }
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      source: useAI ? 'ai' : 'demo',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[POST /api/ai]', error);
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return available AI capabilities
  return NextResponse.json({
    available: true,
    aiConfigured: isAIConfigured,
    features: [
      { id: 'script-analyzer', name: 'Script Intelligence', description: 'Deep analysis of your script' },
      { id: 'budget-forecast', name: 'Budget Forecast', description: 'Predict production costs' },
      { id: 'shot-suggest', name: 'Shot Recommender', description: 'AI shot suggestions' },
      { id: 'schedule', name: 'Schedule Optimizer', description: 'Optimize shooting schedule' },
      { id: 'risk-detect', name: 'Risk Detector', description: 'Identify production risks' },
      { id: 'dialogue', name: 'Dialogue Refiner', description: 'Improve script dialogue' },
    ],
  });
}
