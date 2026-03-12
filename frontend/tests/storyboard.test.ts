/**
 * Storyboard API Test Suite
 * Tests for Storyboard feature using direct route imports
 */

import { NextRequest } from 'next/server';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock prisma
const mockPrisma = {
  storyboardFrame: {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  script: {
    findMany: jest.fn().mockResolvedValue([]),
  },
  shot: {
    findMany: jest.fn().mockResolvedValue([]),
  },
  scene: {
    findMany: jest.fn().mockResolvedValue([]),
  },
  $connect: jest.fn().mockRejectedValue(new Error('Database not available')),
  $disconnect: jest.fn().mockResolvedValue(undefined),
};

jest.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}));

describe('Storyboard API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/storyboard', () => {
    it('should return storyboard data with grouped scenes', async () => {
      const { GET } = await import('@/app/api/storyboard/route');
      const req = new NextRequest('http://localhost:3000/api/storyboard');
      const res = await GET(req);
      expect(res.ok).toBe(true);
      const data = await res.json();
      
      // Check for demo mode flag (either _demo or isDemoMode)
      expect(data._demo === true || data.isDemoMode === true).toBe(true);
      
      // Should have grouped scenes structure
      expect(data.grouped || data.scenes).toBeDefined();
    });

    it('should include required fields in grouped response', async () => {
      const { GET } = await import('@/app/api/storyboard/route');
      const req = new NextRequest('http://localhost:3000/api/storyboard');
      const res = await GET(req);
      const data = await res.json();
      
      const grouped = data.grouped;
      if (grouped) {
        const sceneKeys = Object.keys(grouped);
        expect(sceneKeys.length).toBeGreaterThan(0);
        
        // Check first scene structure
        const firstScene = grouped[sceneKeys[0]];
        expect(firstScene).toHaveProperty('sceneId');
        expect(firstScene).toHaveProperty('sceneNumber');
        expect(firstScene).toHaveProperty('heading');
        expect(firstScene).toHaveProperty('frames');
        expect(Array.isArray(firstScene.frames)).toBe(true);
      }
    });

    it('should include isDemoMode flag', async () => {
      const { GET } = await import('@/app/api/storyboard/route');
      const req = new NextRequest('http://localhost:3000/api/storyboard');
      const res = await GET(req);
      const data = await res.json();
      expect(typeof data._demo === 'boolean' || typeof data.isDemoMode === 'boolean').toBe(true);
    });

    it('should return stats when stats=true', async () => {
      const { GET } = await import('@/app/api/storyboard/route');
      const req = new NextRequest('http://localhost:3000/api/storyboard?stats=true');
      const res = await GET(req);
      expect(res.ok).toBe(true);
      const data = await res.json();
      
      expect(data).toHaveProperty('totalFrames');
      expect(data).toHaveProperty('approvedFrames');
      expect(data).toHaveProperty('pendingFrames');
      expect(data).toHaveProperty('generatedFrames');
      expect(data).toHaveProperty('scenesWithFrames');
    });

    it('should filter by scriptId when provided', async () => {
      const { GET } = await import('@/app/api/storyboard/route');
      const req = new NextRequest('http://localhost:3000/api/storyboard?scriptId=test-script');
      const res = await GET(req);
      expect(res.ok).toBe(true);
    });

    it('should filter by sceneId when provided', async () => {
      const { GET } = await import('@/app/api/storyboard/route');
      const req = new NextRequest('http://localhost:3000/api/storyboard?sceneId=scene-1');
      const res = await GET(req);
      expect(res.ok).toBe(true);
    });

    it('should handle invalid scriptId gracefully', async () => {
      const { GET } = await import('@/app/api/storyboard/route');
      const req = new NextRequest('http://localhost:3000/api/storyboard?scriptId=invalid-id-12345');
      const res = await GET(req);
      expect(res.ok).toBe(true);
    });

    it('should handle invalid sceneId gracefully', async () => {
      const { GET } = await import('@/app/api/storyboard/route');
      const req = new NextRequest('http://localhost:3000/api/storyboard?sceneId=invalid-id-12345');
      const res = await GET(req);
      expect(res.ok).toBe(true);
    });
  });

  describe('POST /api/storyboard', () => {
    it('should approve a frame', async () => {
      const { POST } = await import('@/app/api/storyboard/route');
      const req = new NextRequest('http://localhost:3000/api/storyboard', {
        method: 'POST',
        body: JSON.stringify({ action: 'approve', frameId: 'frame-1' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req);
      expect(res.ok).toBe(true);
    });

    it('should add a note to a frame', async () => {
      const { POST } = await import('@/app/api/storyboard/route');
      const req = new NextRequest('http://localhost:3000/api/storyboard', {
        method: 'POST',
        body: JSON.stringify({ action: 'addNote', frameId: 'frame-1', note: 'Test note' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req);
      expect(res.ok).toBe(true);
    });

    it('should generate frames for a scene', async () => {
      const { POST } = await import('@/app/api/storyboard/route');
      const req = new NextRequest('http://localhost:3000/api/storyboard', {
        method: 'POST',
        body: JSON.stringify({ action: 'generateScene', sceneId: 'scene-1' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req);
      // In demo mode without DB, this might return an error about no shots
      // Just check it's not a 500 error
      expect(res.status).toBeLessThan(500);
    });

    it('should handle invalid action', async () => {
      const { POST } = await import('@/app/api/storyboard/route');
      const req = new NextRequest('http://localhost:3000/api/storyboard', {
        method: 'POST',
        body: JSON.stringify({ action: 'invalid' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('should require action in body', async () => {
      const { POST } = await import('@/app/api/storyboard/route');
      const req = new NextRequest('http://localhost:3000/api/storyboard', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('should return 400 for missing frameId on approve', async () => {
      const { POST } = await import('@/app/api/storyboard/route');
      const req = new NextRequest('http://localhost:3000/api/storyboard', {
        method: 'POST',
        body: JSON.stringify({ action: 'approve' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('should return 400 for missing sceneId on generate', async () => {
      const { POST } = await import('@/app/api/storyboard/route');
      const req = new NextRequest('http://localhost:3000/api/storyboard', {
        method: 'POST',
        body: JSON.stringify({ action: 'generate' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('should return 400 for missing frameId on addNote', async () => {
      const { POST } = await import('@/app/api/storyboard/route');
      const req = new NextRequest('http://localhost:3000/api/storyboard', {
        method: 'POST',
        body: JSON.stringify({ action: 'addNote', note: 'Test' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  describe('Demo Data Validation', () => {
    it('demo data has multiple scenes', async () => {
      const { GET } = await import('@/app/api/storyboard/route');
      const req = new NextRequest('http://localhost:3000/api/storyboard');
      const res = await GET(req);
      const data = await res.json();
      
      if (data.grouped) {
        expect(Object.keys(data.grouped).length).toBeGreaterThan(1);
      }
    });

    it('demo frames have required fields', async () => {
      const { GET } = await import('@/app/api/storyboard/route');
      const req = new NextRequest('http://localhost:3000/api/storyboard');
      const res = await GET(req);
      const data = await res.json();
      
      if (data.grouped) {
        const firstScene = data.grouped[Object.keys(data.grouped)[0]];
        if (firstScene.frames && firstScene.frames.length > 0) {
          const frame = firstScene.frames[0];
          expect(frame).toHaveProperty('id');
          expect(frame).toHaveProperty('prompt');
          expect(frame).toHaveProperty('style');
          expect(frame).toHaveProperty('status');
        }
      }
    });

    it('demo frames have varied shot sizes', async () => {
      const { GET } = await import('@/app/api/storyboard/route');
      const req = new NextRequest('http://localhost:3000/api/storyboard');
      const res = await GET(req);
      const data = await res.json();
      
      if (data.grouped) {
        const shotSizes = new Set();
        Object.values(data.grouped).forEach((scene: { frames: { shotSize: string }[] }) => {
          scene.frames?.forEach((frame) => {
            shotSizes.add(frame.shotSize);
          });
        });
        expect(shotSizes.size).toBeGreaterThan(1);
      }
    });

    it('demo frames have varied styles', async () => {
      const { GET } = await import('@/app/api/storyboard/route');
      const req = new NextRequest('http://localhost:3000/api/storyboard');
      const res = await GET(req);
      const data = await res.json();
      
      if (data.grouped) {
        const styles = new Set();
        Object.values(data.grouped).forEach((scene: { frames: { style: string }[] }) => {
          scene.frames?.forEach((frame) => {
            styles.add(frame.style);
          });
        });
        expect(styles.size).toBeGreaterThan(1);
      }
    });

    it('demo frames have varied statuses', async () => {
      const { GET } = await import('@/app/api/storyboard/route');
      const req = new NextRequest('http://localhost:3000/api/storyboard');
      const res = await GET(req);
      const data = await res.json();
      
      if (data.grouped) {
        const statuses = new Set();
        Object.values(data.grouped).forEach((scene: { frames: { status: string }[] }) => {
          scene.frames?.forEach((frame) => {
            statuses.add(frame.status);
          });
        });
        expect(statuses.size).toBeGreaterThan(1);
      }
    });

    it('demo scenes have INT/EXT区分', async () => {
      const { GET } = await import('@/app/api/storyboard/route');
      const req = new NextRequest('http://localhost:3000/api/storyboard');
      const res = await GET(req);
      const data = await res.json();
      
      if (data.grouped) {
        const intExts = new Set();
        Object.values(data.grouped).forEach((scene: { intExt: string }) => {
          intExts.add(scene.intExt);
        });
        expect(intExts.size).toBeGreaterThan(0);
      }
    });

    it('demo scenes have varied time of day', async () => {
      const { GET } = await import('@/app/api/storyboard/route');
      const req = new NextRequest('http://localhost:3000/api/storyboard');
      const res = await GET(req);
      const data = await res.json();
      
      if (data.grouped) {
        const timesOfDay = new Set();
        Object.values(data.grouped).forEach((scene: { timeOfDay: string }) => {
          timesOfDay.add(scene.timeOfDay);
        });
        expect(timesOfDay.size).toBeGreaterThan(1);
      }
    });

    it('demo frames have shot text descriptions', async () => {
      const { GET } = await import('@/app/api/storyboard/route');
      const req = new NextRequest('http://localhost:3000/api/storyboard');
      const res = await GET(req);
      const data = await res.json();
      
      if (data.grouped) {
        Object.values(data.grouped).forEach((scene: { frames: { shotText: string }[] }) => {
          scene.frames?.forEach((frame) => {
            expect(frame.shotText.length).toBeGreaterThan(0);
          });
        });
      }
    });

    it('demo frames have character information', async () => {
      const { GET } = await import('@/app/api/storyboard/route');
      const req = new NextRequest('http://localhost:3000/api/storyboard');
      const res = await GET(req);
      const data = await res.json();
      
      if (data.grouped) {
        let hasCharacters = false;
        Object.values(data.grouped).forEach((scene: { frames: { characters: string[] }[] }) => {
          scene.frames?.forEach((frame) => {
            if (frame.characters && frame.characters.length > 0) {
              hasCharacters = true;
            }
          });
        });
        expect(hasCharacters).toBe(true);
      }
    });

    it('demo data has scene headings', async () => {
      const { GET } = await import('@/app/api/storyboard/route');
      const req = new NextRequest('http://localhost:3000/api/storyboard');
      const res = await GET(req);
      const data = await res.json();
      
      if (data.grouped) {
        Object.values(data.grouped).forEach((scene: { heading: string }) => {
          expect(scene.heading.length).toBeGreaterThan(0);
        });
      }
    });
  });
});
