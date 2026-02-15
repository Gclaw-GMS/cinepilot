// CinePilot API Client - Phase 25
// Advanced AI Features, Film Comparison, Budget Prediction

const API_BASE = 'http://localhost:8000';

// Film Comparison
export async function compareWithFilms(scriptContent: string, genre: string = 'drama') {
  const response = await fetch(`${API_BASE}/api/ai/film-comparison`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ script_content: scriptContent, genre }),
  });
  return response.json();
}

// Budget Prediction
export async function predictBudget(scenes: any[], duration: number, genre: string = 'drama') {
  const response = await fetch(`${API_BASE}/api/ai/predict-budget`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenes, duration, genre }),
  });
  return response.json();
}

// Scene Similarity Analysis
export async function analyzeSceneSimilarity(scenes: any[]) {
  const response = await fetch(`${API_BASE}/api/ai/scene-similarity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenes }),
  });
  return response.json();
}

// Weather-aware Scheduling
export async function getWeatherSchedule(schedule: any[], location: string = 'Chennai') {
  const response = await fetch(`${API_BASE}/api/ai/weather-schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ schedule, location }),
  });
  return response.json();
}

// Character Network Analysis
export async function analyzeCharacterNetwork(scenes: any[], characters: any[]) {
  const response = await fetch(`${API_BASE}/api/ai/character-network`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenes, characters }),
  });
  return response.json();
}

// VFX Requirements Analysis
export async function analyzeVFXRequirements(scenes: any[]) {
  const response = await fetch(`${API_BASE}/api/ai/vfx-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenes }),
  });
  return response.json();
}

// All Phase 25 exports
export default {
  compareWithFilms,
  predictBudget,
  analyzeSceneSimilarity,
  getWeatherSchedule,
  analyzeCharacterNetwork,
  analyzeVFXRequirements,
};
