/**
 * Dubbing API Tests
 * Run with: npx jest tests/dubbing.test.ts
 */

const API_BASE = 'http://localhost:3002/api/dubbing';

describe('Dubbing API', () => {
  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  describe('GET /api/dubbing', () => {
    test('returns scripts and dubbed versions in demo mode', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('scripts');
      expect(data).toHaveProperty('dubbedVersions');
      expect(data).toHaveProperty('isDemoMode');
      expect(Array.isArray(data.scripts)).toBe(true);
    });

    test('scripts have required fields', async () => {
      const res = await fetch(API_BASE);
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
      const res = await fetch(API_BASE);
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
      const res = await fetch(API_BASE);
      const data = await res.json();

      expect(typeof data.isDemoMode).toBe('boolean');
    });

    test('returns demo data when no scriptId provided', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      // Should return demo data
      expect(data.scripts.length).toBeGreaterThan(0);
    });

    test('returns demo data with demo query param', async () => {
      const res = await fetch(`${API_BASE}?demo=true`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.isDemoMode).toBe(true);
    });
  });

  describe('POST /api/dubbing - Generate Translation', () => {
    test('generates dubbing translation with valid params', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId: 'demo-1',
          targetLanguage: 'telugu',
          demo: true,
        }),
      });

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
        const res = await fetch(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scriptId: 'demo-1',
            targetLanguage: lang,
            demo: true,
          }),
        });

        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.language).toBe(lang);
      }
    });

    test('returns 400 when scriptId is missing', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetLanguage: 'telugu',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });

    test('returns 400 when targetLanguage is missing', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId: 'demo-1',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });

    test('returns 400 for unsupported language', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId: 'demo-1',
          targetLanguage: 'french',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Unsupported language');
    });

    test('translated scenes have required fields', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId: 'demo-1',
          targetLanguage: 'telugu',
          demo: true,
        }),
      });

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
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId: 'demo-1',
          targetLanguage: 'hindi',
        }),
      });

      const data = await res.json();

      expect(res.status).toBe(200);
      // Should fall back to demo mode since script doesn't exist in DB
      expect(data.isDemoMode).toBe(true);
    });

    test('handles empty body gracefully', async () => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('Demo Data Validation', () => {
    test('demo scripts contain Tamil films', async () => {
      const res = await fetch(API_BASE);
      const data = await res.json();

      expect(data.scripts.length).toBeGreaterThan(0);
      const hasTamilContent = data.scripts.some((s: any) => 
        s.title.toLowerCase().includes('tamil') || s.language === 'tamil'
      );
      expect(hasTamilContent).toBe(true);
    });

    test('demo dubbed versions cover multiple languages', async () => {
      const res = await fetch(API_BASE);
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
});
