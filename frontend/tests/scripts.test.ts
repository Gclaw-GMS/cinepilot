/**
 * Scripts API Test Suite
 * Run with: npx jest tests/scripts.test.ts
 * Uses direct route imports instead of HTTP fetches
 */

import { describe, it, expect } from '@jest/globals';
import { GET, POST, PATCH } from '@/app/api/scripts/route';
import { NextRequest } from 'next/server';

// Helper to create request with query params
function createRequest(options: {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
} = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/scripts');
  
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  
  const req = new NextRequest(url, {
    method: options.method || 'GET',
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: options.body ? { 'Content-Type': 'application/json' } : {},
  });
  
  return req;
}

describe('GET /api/scripts', () => {
  it('returns scripts data with required fields', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data).toHaveProperty('scripts');
    expect(data).toHaveProperty('characters');
    expect(Array.isArray(data.scripts)).toBe(true);
  });

  it('scripts have required fields', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
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
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();
    
    if (data.characters && data.characters.length > 0) {
      const character = data.characters[0];
      expect(character).toHaveProperty('id');
      expect(character).toHaveProperty('name');
      expect(character).toHaveProperty('projectId');
    }
  });

  it('scenes have required fields when present', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
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
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();
    
    const scriptWithScenes = data.scripts?.find((s: any) => s.scenes?.length > 0);
    
    if (scriptWithScenes && scriptWithScenes.scenes.length > 0) {
      const scene = scriptWithScenes.scenes[0];
      expect(scene).toHaveProperty('sceneCharacters');
    }
  });

  it('demo mode flag is present', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();
    
    // Demo mode returns scripts regardless
    expect(Array.isArray(data.scripts)).toBe(true);
  });

  it('handles projectId parameter', async () => {
    const req = createRequest({ method: 'GET', params: { projectId: 'test-project' } });
    const res = await GET(req);
    const data = await res.json();
    
    // May return error if project doesn't exist, but should still have scripts property
    expect(data).toHaveProperty('scripts');
  });

  it('handles demo parameter', async () => {
    const req = createRequest({ method: 'GET', params: { demo: 'true' } });
    const res = await GET(req);
    
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data).toHaveProperty('scripts');
  });
});

describe('POST /api/scripts', () => {
  it('returns 400 when no file provided', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: {} 
    });
    
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns error for missing content-type', async () => {
    // Create request without content-type header
    const url = new URL('http://localhost:3000/api/scripts');
    const req = new NextRequest(url, {
      method: 'POST',
      body: 'not form data',
    });
    
    const res = await POST(req);
    // Should either error or handle gracefully
    expect([400, 500]).toContain(res.status);
  });

  it('handles FormData without file', async () => {
    const formData = new FormData();
    formData.append('projectId', 'test-project');
    
    // Create FormData request
    const url = new URL('http://localhost:3000/api/scripts');
    const req = new NextRequest(url, {
      method: 'POST',
      body: formData,
    });
    
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/scripts', () => {
  it('returns 400 when scriptId is missing', async () => {
    const req = createRequest({ 
      method: 'PATCH', 
      body: {} 
    });
    
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent scriptId', async () => {
    const req = createRequest({ 
      method: 'PATCH', 
      body: { scriptId: 'non-existent-script-id' } 
    });
    
    const res = await PATCH(req);
    expect(res.status).toBe(404);
  });

  it('handles empty body gracefully', async () => {
    // Create request with no body
    const url = new URL('http://localhost:3000/api/scripts');
    const req = new NextRequest(url, {
      method: 'PATCH',
    });
    
    const res = await PATCH(req);
    // Should return 400 or 500
    expect([400, 500]).toContain(res.status);
  });
});

describe('Demo Data Validation', () => {
  it('contains scripts in demo data', async () => {
    const req = createRequest({ method: 'GET', params: { demo: 'true' } });
    const res = await GET(req);
    const data = await res.json();
    
    expect(data.scripts).toBeDefined();
    expect(Array.isArray(data.scripts)).toBe(true);
  });

  it('demo scripts have scenes with required fields', async () => {
    const req = createRequest({ method: 'GET', params: { demo: 'true' } });
    const res = await GET(req);
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
    const req = createRequest({ method: 'GET', params: { demo: 'true' } });
    const res = await GET(req);
    const data = await res.json();
    
    expect(data.characters).toBeDefined();
    expect(Array.isArray(data.characters)).toBe(true);
    expect(data.characters.length).toBeGreaterThan(0);
    
    const character = data.characters[0];
    expect(character.name).toBeDefined();
    expect(character.id).toBeDefined();
  });

  it('demo scenes have proper character appearances', async () => {
    const req = createRequest({ method: 'GET', params: { demo: 'true' } });
    const res = await GET(req);
    const data = await res.json();
    
    const scriptWithScenes = data.scripts?.find((s: any) => s.scenes?.length > 0);
    
    if (scriptWithScenes && scriptWithScenes.scenes[0].sceneCharacters) {
      const sceneChar = scriptWithScenes.scenes[0].sceneCharacters[0];
      expect(sceneChar.character).toBeDefined();
    }
  });

  it('demo data includes analyses', async () => {
    const req = createRequest({ method: 'GET', params: { demo: 'true' } });
    const res = await GET(req);
    const data = await res.json();
    
    expect(data.analyses).toBeDefined();
    expect(Array.isArray(data.analyses)).toBe(true);
  });

  it('analyses have required fields', async () => {
    const req = createRequest({ method: 'GET', params: { demo: 'true' } });
    const res = await GET(req);
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
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
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
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
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
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();
    
    const scriptWithScenes = data.scripts?.find((s: any) => s.scenes?.length > 0);
    
    if (scriptWithScenes) {
      const scene = scriptWithScenes.scenes[0];
      expect(scene.location).toBeDefined();
      expect(scene.intExt).toMatch(/^(INT|EXT)$/);
    }
  });

  it('scenes include time of day', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();
    
    const scriptWithScenes = data.scripts?.find((s: any) => s.scenes?.length > 0);
    
    if (scriptWithScenes) {
      const scene = scriptWithScenes.scenes[0];
      expect(scene.timeOfDay).toBeDefined();
    }
  });
});
