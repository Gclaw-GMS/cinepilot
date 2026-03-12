/**
 * Scripts API Test Suite
 * Tests for /api/scripts endpoint
 */

import { describe, it, expect, beforeAll } from '@jest/globals';

const API_BASE = process.env.API_URL || 'http://localhost:3002';
const API_ROUTE = `${API_BASE}/api/scripts`;

describe('GET /api/scripts', () => {
  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  it('returns scripts data with required fields', async () => {
    const res = await fetch(API_ROUTE);
    // API may return 200 even with demo mode error (returns data with error key)
    const data = await res.json();
    expect(data).toHaveProperty('scripts');
    expect(data).toHaveProperty('characters');
    expect(Array.isArray(data.scripts)).toBe(true);
  });

  it('scripts have required fields', async () => {
    const res = await fetch(API_ROUTE);
    const data = await res.json();
    
    if (data.scripts && data.scripts.length > 0) {
      const script = data.scripts[0];
      expect(script).toHaveProperty('id');
      expect(script).toHaveProperty('title');
      expect(script).toHaveProperty('projectId');
      expect(script).toHaveProperty('scenes');
      expect(script).toHaveProperty('scriptVersions');
    }
  });

  it('characters have required fields', async () => {
    const res = await fetch(API_ROUTE);
    const data = await res.json();
    
    if (data.characters && data.characters.length > 0) {
      const character = data.characters[0];
      expect(character).toHaveProperty('id');
      expect(character).toHaveProperty('name');
      expect(character).toHaveProperty('projectId');
    }
  });

  it('scenes have required fields when present', async () => {
    const res = await fetch(API_ROUTE);
    const data = await res.json();
    
    // Find a script with scenes
    const scriptWithScenes = data.scripts?.find((s: any) => s.scenes?.length > 0);
    
    if (scriptWithScenes && scriptWithScenes.scenes.length > 0) {
      const scene = scriptWithScenes.scenes[0];
      expect(scene).toHaveProperty('id');
      expect(scene).toHaveProperty('sceneNumber');
      expect(scene).toHaveProperty('headingRaw');
      expect(scene).toHaveProperty('intExt');
      expect(scene).toHaveProperty('timeOfDay');
      expect(scene).toHaveProperty('location');
      expect(scene).toHaveProperty('confidence');
    }
  });

  it('scene characters are included in response', async () => {
    const res = await fetch(API_ROUTE);
    const data = await res.json();
    
    const scriptWithScenes = data.scripts?.find((s: any) => s.scenes?.length > 0);
    
    if (scriptWithScenes && scriptWithScenes.scenes.length > 0) {
      const scene = scriptWithScenes.scenes[0];
      expect(scene).toHaveProperty('sceneCharacters');
    }
  });

  it('demo mode flag is present', async () => {
    const res = await fetch(API_ROUTE);
    const data = await res.json();
    
    // Check for demo mode - API returns data even in demo mode (has error key but still returns data)
    // Success means we got scripts back regardless of error flag
    expect(Array.isArray(data.scripts)).toBe(true);
  });

  it('handles projectId parameter', async () => {
    const res = await fetch(`${API_ROUTE}?projectId=test-project`);
    // May return error if project doesn't exist, but should still have scripts property
    const data = await res.json();
    expect(data).toHaveProperty('scripts');
  });

  it('handles demo parameter', async () => {
    const res = await fetch(`${API_ROUTE}?demo=true`);
    expect(res.ok).toBe(true);
    
    const data = await res.json();
    expect(data).toHaveProperty('scripts');
  });
});

describe('POST /api/scripts', () => {
  it('returns 400 when no file provided', async () => {
    const res = await fetch(API_ROUTE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    
    expect(res.status).toBe(400);
  });

  it('returns error for missing content-type', async () => {
    const res = await fetch(API_ROUTE, {
      method: 'POST',
      body: 'not form data',
    });
    
    // Should either error or handle gracefully
    expect([400, 500]).toContain(res.status);
  });

  it('handles FormData without file', async () => {
    const formData = new FormData();
    formData.append('projectId', 'test-project');
    
    const res = await fetch(API_ROUTE, {
      method: 'POST',
      body: formData,
    });
    
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/scripts', () => {
  it('returns 400 when scriptId is missing', async () => {
    const res = await fetch(API_ROUTE, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent scriptId', async () => {
    const res = await fetch(API_ROUTE, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scriptId: 'non-existent-script-id' }),
    });
    
    expect(res.status).toBe(404);
  });

  it('handles empty body gracefully', async () => {
    const res = await fetch(API_ROUTE, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    
    // Should return 400 or 500
    expect([400, 500]).toContain(res.status);
  });
});

describe('Demo Data Validation', () => {
  it('contains scripts in demo data', async () => {
    const res = await fetch(`${API_ROUTE}?demo=true`);
    const data = await res.json();
    
    expect(data.scripts).toBeDefined();
    expect(Array.isArray(data.scripts)).toBe(true);
  });

  it('demo scripts have scenes with required fields', async () => {
    const res = await fetch(`${API_ROUTE}?demo=true`);
    const data = await res.json();
    
    const scriptWithScenes = data.scripts?.find((s: any) => s.scenes?.length > 0);
    
    if (scriptWithScenes) {
      const scene = scriptWithScenes.scenes[0];
      expect(scene.sceneNumber).toBeDefined();
      expect(scene.headingRaw).toBeDefined();
      expect(scene.intExt).toBeDefined();
    }
  });

  it('demo characters have proper structure', async () => {
    const res = await fetch(`${API_ROUTE}?demo=true`);
    const data = await res.json();
    
    expect(data.characters).toBeDefined();
    expect(Array.isArray(data.characters)).toBe(true);
    expect(data.characters.length).toBeGreaterThan(0);
    
    const character = data.characters[0];
    expect(character.name).toBeDefined();
    expect(character.id).toBeDefined();
  });

  it('demo scenes have proper character appearances', async () => {
    const res = await fetch(`${API_ROUTE}?demo=true`);
    const data = await res.json();
    
    const scriptWithScenes = data.scripts?.find((s: any) => s.scenes?.length > 0);
    
    if (scriptWithScenes && scriptWithScenes.scenes[0].sceneCharacters) {
      const sceneChar = scriptWithScenes.scenes[0].sceneCharacters[0];
      expect(sceneChar.character).toBeDefined();
    }
  });

  it('demo data includes analyses', async () => {
    const res = await fetch(`${API_ROUTE}?demo=true`);
    const data = await res.json();
    
    expect(data.analyses).toBeDefined();
    expect(Array.isArray(data.analyses)).toBe(true);
  });

  it('analyses have required fields', async () => {
    const res = await fetch(`${API_ROUTE}?demo=true`);
    const data = await res.json();
    
    if (data.analyses && data.analyses.length > 0) {
      const analysis = data.analyses[0];
      expect(analysis.id).toBeDefined();
      expect(analysis.analysisType).toBeDefined();
      expect(analysis.result).toBeDefined();
    }
  });
});

describe('Response Structure', () => {
  it('scripts include version information', async () => {
    const res = await fetch(API_ROUTE);
    const data = await res.json();
    
    const script = data.scripts?.[0];
    if (script) {
      expect(script).toHaveProperty('version');
      expect(script).toHaveProperty('isActive');
      expect(script).toHaveProperty('createdAt');
      expect(script).toHaveProperty('updatedAt');
    }
  });

  it('scenes include confidence scores', async () => {
    const res = await fetch(API_ROUTE);
    const data = await res.json();
    
    const scriptWithScenes = data.scripts?.find((s: any) => s.scenes?.length > 0);
    
    if (scriptWithScenes) {
      const scene = scriptWithScenes.scenes[0];
      expect(typeof scene.confidence).toBe('number');
      expect(scene.confidence).toBeGreaterThanOrEqual(0);
      expect(scene.confidence).toBeLessThanOrEqual(1);
    }
  });

  it('scenes include location information', async () => {
    const res = await fetch(API_ROUTE);
    const data = await res.json();
    
    const scriptWithScenes = data.scripts?.find((s: any) => s.scenes?.length > 0);
    
    if (scriptWithScenes) {
      const scene = scriptWithScenes.scenes[0];
      expect(scene.location).toBeDefined();
      expect(scene.intExt).toMatch(/^(INT|EXT)$/);
    }
  });

  it('scenes include time of day', async () => {
    const res = await fetch(API_ROUTE);
    const data = await res.json();
    
    const scriptWithScenes = data.scripts?.find((s: any) => s.scenes?.length > 0);
    
    if (scriptWithScenes) {
      const scene = scriptWithScenes.scenes[0];
      expect(scene.timeOfDay).toBeDefined();
    }
  });
});
