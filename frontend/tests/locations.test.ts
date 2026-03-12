import { GET, POST } from '@/app/api/locations/route';
import { NextRequest } from 'next/server';

// Mock the prisma module
jest.mock('@/lib/db', () => ({
  prisma: {
    script: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    scene: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

// Mock the locations scouter module
jest.mock('@/lib/locations/scouter', () => ({
  scoutLocations: jest.fn().mockResolvedValue({
    candidates: [
      { id: 'cand-1', name: 'Marina Beach Promenade', latitude: '13.0500', longitude: '80.2824', placeType: 'beach', scoreTotal: 85, scoreAccess: 90, scoreLocality: 80, riskFlags: [], explanation: 'Wide open space perfect for night shoots.' }
    ],
    total: 1,
  }),
  getCandidatesForScene: jest.fn().mockResolvedValue({
    id: 'intent-1',
    sceneId: 'scene-1',
    keywords: ['street', 'urban'],
    terrainType: 'urban',
    candidates: [
      { id: 'cand-1', name: 'Marina Beach Promenade', latitude: '13.0500', longitude: '80.2824', placeType: 'beach', scoreTotal: 85, scoreAccess: 90, scoreLocality: 80, riskFlags: ['Tourist crowd'], explanation: 'Wide open space perfect for night shoots with excellent crowd control options.' }
    ],
  }),
}));

describe('Locations API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/locations', () => {
    it('returns scenes with location intents', async () => {
      const req = new NextRequest('http://localhost:3000/api/locations');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('scenes');
      expect(Array.isArray(data.scenes)).toBe(true);
    });

    it('returns demo mode flag', async () => {
      const req = new NextRequest('http://localhost:3000/api/locations');
      const res = await GET(req);
      const data = await res.json();

      expect(data).toHaveProperty('_demo');
      expect(typeof data._demo).toBe('boolean');
    });

    it('includes scene number and heading', async () => {
      const req = new NextRequest('http://localhost:3000/api/locations');
      const res = await GET(req);
      const data = await res.json();

      if (data.scenes.length > 0) {
        expect(data.scenes[0]).toHaveProperty('sceneNumber');
        expect(data.scenes[0]).toHaveProperty('headingRaw');
      }
    });

    it('includes location and locationIntents', async () => {
      const req = new NextRequest('http://localhost:3000/api/locations');
      const res = await GET(req);
      const data = await res.json();

      if (data.scenes.length > 0) {
        expect(data.scenes[0]).toHaveProperty('location');
        expect(data.scenes[0]).toHaveProperty('locationIntents');
      }
    });

    it('supports sceneId parameter to get candidates', async () => {
      const req = new NextRequest('http://localhost:3000/api/locations?sceneId=scene-1');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('intent');
      expect(data.intent).toHaveProperty('candidates');
    });

    it('supports stats parameter for dashboard', async () => {
      const req = new NextRequest('http://localhost:3000/api/locations?stats=true');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('scenes');
      // Stats should have flat format with candidates count
      if (data.scenes.length > 0) {
        expect(data.scenes[0]).toHaveProperty('candidates');
        expect(typeof data.scenes[0].candidates).toBe('number');
      }
    });

    it('supports projectId parameter', async () => {
      const req = new NextRequest('http://localhost:3000/api/locations?projectId=my-project');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('scenes');
    });

    it('locationIntents contain keywords and terrainType', async () => {
      const req = new NextRequest('http://localhost:3000/api/locations');
      const res = await GET(req);
      const data = await res.json();

      if (data.scenes.length > 0 && data.scenes[0].locationIntents?.length > 0) {
        const intent = data.scenes[0].locationIntents[0];
        expect(intent).toHaveProperty('keywords');
        expect(intent).toHaveProperty('terrainType');
        expect(Array.isArray(intent.keywords)).toBe(true);
      }
    });

    it('candidates have score information', async () => {
      const req = new NextRequest('http://localhost:3000/api/locations?sceneId=scene-1');
      const res = await GET(req);
      const data = await res.json();

      if (data.intent?.candidates?.length > 0) {
        const candidate = data.intent.candidates[0];
        expect(candidate).toHaveProperty('scoreTotal');
        expect(candidate).toHaveProperty('name');
        expect(candidate).toHaveProperty('placeType');
      }
    });
  });

  describe('POST /api/locations', () => {
    it('scouts locations with action and sceneId', async () => {
      const req = new NextRequest('http://localhost:3000/api/locations', {
        method: 'POST',
        body: JSON.stringify({ action: 'scout', sceneId: 'scene-1' }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('candidates');
      expect(data).toHaveProperty('message');
    });

    it('supports region parameter for scouting', async () => {
      const req = new NextRequest('http://localhost:3000/api/locations', {
        method: 'POST',
        body: JSON.stringify({ action: 'scout', sceneId: 'scene-1', region: 'Chennai' }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveProperty('candidates');
    });

    it('returns 400 for invalid action', async () => {
      const req = new NextRequest('http://localhost:3000/api/locations', {
        method: 'POST',
        body: JSON.stringify({ action: 'invalid-action', sceneId: 'scene-1' }),
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    it('returns 400 for missing sceneId', async () => {
      const req = new NextRequest('http://localhost:3000/api/locations', {
        method: 'POST',
        body: JSON.stringify({ action: 'scout' }),
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    it('handles empty body gracefully', async () => {
      const req = new NextRequest('http://localhost:3000/api/locations', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
    });
  });

  describe('Demo Data Validation', () => {
    it('returns realistic demo data structure', async () => {
      const req = new NextRequest('http://localhost:3000/api/locations');
      const res = await GET(req);
      const data = await res.json();

      expect(data._demo).toBe(true);
      expect(data.scenes.length).toBeGreaterThan(0);
    });

    it('demo scenes have varied terrain types', async () => {
      const req = new NextRequest('http://localhost:3000/api/locations');
      const res = await GET(req);
      const data = await res.json();

      const terrainTypes = new Set();
      data.scenes.forEach((scene: any) => {
        scene.locationIntents?.forEach((intent: any) => {
          terrainTypes.add(intent.terrainType);
        });
      });

      expect(terrainTypes.size).toBeGreaterThan(1);
    });

    it('demo candidates have scoring information', async () => {
      const req = new NextRequest('http://localhost:3000/api/locations?sceneId=scene-1');
      const res = await GET(req);
      const data = await res.json();

      if (data.intent?.candidates?.length > 0) {
        const candidate = data.intent.candidates[0];
        expect(candidate).toHaveProperty('scoreTotal');
        expect(candidate).toHaveProperty('scoreAccess');
        expect(candidate).toHaveProperty('scoreLocality');
      }
    });

    it('demo candidates have risk flags', async () => {
      const req = new NextRequest('http://localhost:3000/api/locations?sceneId=scene-1');
      const res = await GET(req);
      const data = await res.json();

      if (data.intent?.candidates?.length > 0) {
        const candidate = data.intent.candidates[0];
        expect(candidate).toHaveProperty('riskFlags');
        expect(Array.isArray(candidate.riskFlags)).toBe(true);
      }
    });

    it('demo candidates have explanations', async () => {
      const req = new NextRequest('http://localhost:3000/api/locations?sceneId=scene-1');
      const res = await GET(req);
      const data = await res.json();

      if (data.intent?.candidates?.length > 0) {
        const candidate = data.intent.candidates[0];
        expect(candidate).toHaveProperty('explanation');
        expect(typeof candidate.explanation).toBe('string');
      }
    });
  });
});
