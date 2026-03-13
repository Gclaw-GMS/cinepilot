/**
 * Dubbing API Tests
 * Run with: npx jest tests/dubbing.test.ts
 * Uses direct route imports instead of HTTP fetches
 */

import { describe, it, expect } from '@jest/globals';
import { GET, POST } from '@/app/api/dubbing/route';
import { NextRequest } from 'next/server';

// Helper to create request with query params
function createRequest(options: {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
} = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/dubbing');
  
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

describe('GET /api/dubbing', () => {
  test('returns scripts and dubbed versions in demo mode', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty('scripts');
    expect(data).toHaveProperty('dubbedVersions');
    expect(data).toHaveProperty('isDemoMode');
    expect(Array.isArray(data.scripts)).toBe(true);
  });

  test('scripts have required fields', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();

    if (data.scripts.length > 0) {
      const script = data.scripts[0];
      expect(script).toHaveProperty('id');
      expect(script).toHaveProperty('title');
      expect(typeof script.id).toBe('string');
      expect(typeof script.title).toBe('string');
    }
  });

  test('dubbed versions have required fields when present', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();

    // Check dubbed versions structure
    if (typeof data.dubbedVersions === 'object' && !Array.isArray(data.dubbedVersions)) {
      // It's an object with script IDs as keys
      const keys = Object.keys(data.dubbedVersions);
      if (keys.length > 0) {
        const firstKey = keys[0];
        const versions = data.dubbedVersions[firstKey];
        expect(Array.isArray(versions)).toBe(true);
        if (versions.length > 0) {
          expect(versions[0]).toHaveProperty('id');
          expect(versions[0]).toHaveProperty('title');
          expect(versions[0]).toHaveProperty('language');
        }
      }
    } else if (Array.isArray(data.dubbedVersions)) {
      // It's directly an array
      if (data.dubbedVersions.length > 0) {
        expect(data.dubbedVersions[0]).toHaveProperty('id');
        expect(data.dubbedVersions[0]).toHaveProperty('title');
        expect(data.dubbedVersions[0]).toHaveProperty('language');
      }
    }
  });

  test('demo mode flag is boolean', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();

    expect(typeof data.isDemoMode).toBe('boolean');
  });

  test('returns demo data when no scriptId provided', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();

    // Should return demo data
    expect(data.scripts.length).toBeGreaterThan(0);
  });

  test('returns demo data with demo query param', async () => {
    const req = createRequest({ method: 'GET', params: { demo: 'true' } });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.isDemoMode).toBe(true);
  });
});

describe('POST /api/dubbing - Generate Translation', () => {
  test('generates dubbing translation with valid params', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: {
        scriptId: 'demo-1',
        targetLanguage: 'telugu',
        demo: true,
      }
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty('scriptId');
    expect(data).toHaveProperty('language');
    expect(data).toHaveProperty('scenesTranslated');
    expect(data).toHaveProperty('translatedScenes');
    expect(data.isDemoMode).toBe(true);
  });

  test('generates translation for all supported languages', async () => {
    const languages = ['telugu', 'hindi', 'malayalam', 'kannada', 'english'];

    for (const lang of languages) {
      const req = createRequest({ 
        method: 'POST', 
        body: {
          scriptId: 'demo-1',
          targetLanguage: lang,
          demo: true,
        }
      });
      const res = await POST(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.language).toBe(lang);
    }
  });

  test('returns 400 when scriptId is missing', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: {
        targetLanguage: 'telugu',
      }
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });

  test('returns 400 when targetLanguage is missing', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: {
        scriptId: 'demo-1',
      }
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });

  test('returns 400 for unsupported language', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: {
        scriptId: 'demo-1',
        targetLanguage: 'french',
      }
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Unsupported language');
  });

  test('translated scenes have required fields', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: {
        scriptId: 'demo-1',
        targetLanguage: 'telugu',
        demo: true,
      }
    });
    const res = await POST(req);
    const data = await res.json();

    expect(Array.isArray(data.translatedScenes)).toBe(true);
    if (data.translatedScenes.length > 0) {
      const scene = data.translatedScenes[0];
      expect(scene).toHaveProperty('sceneNumber');
      expect(scene).toHaveProperty('translatedDialogue');
      expect(typeof scene.sceneNumber).toBe('string');
      expect(typeof scene.translatedDialogue).toBe('string');
    }
  });

  test('generates demo translation for demo script ID', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: {
        scriptId: 'demo-1',
        targetLanguage: 'hindi',
      }
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    // Should fall back to demo mode since script doesn't exist in DB
    expect(data.isDemoMode).toBe(true);
  });

  test('handles empty body gracefully', async () => {
    const req = createRequest({ 
      method: 'POST', 
      body: {} 
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});

describe('Demo Data Validation', () => {
  test('demo scripts contain Tamil films', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();

    expect(data.scripts.length).toBeGreaterThan(0);
    const hasTamilContent = data.scripts.some((s: any) => 
      s.title.toLowerCase().includes('tamil') || s.language === 'tamil'
    );
    expect(hasTamilContent).toBe(true);
  });

  test('demo dubbed versions cover multiple languages', async () => {
    const req = createRequest({ method: 'GET' });
    const res = await GET(req);
    const data = await res.json();

    const languages = new Set<string>();
    
    if (typeof data.dubbedVersions === 'object' && !Array.isArray(data.dubbedVersions)) {
      Object.values(data.dubbedVersions).forEach((versions: any) => {
        if (Array.isArray(versions)) {
          versions.forEach((v: any) => languages.add(v.language));
        }
      });
    }

    expect(languages.size).toBeGreaterThanOrEqual(2);
  });
});
