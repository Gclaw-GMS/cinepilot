import { NextRequest, NextResponse } from 'next/server';

// Mock prisma
const mockPrisma = {
  shot: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  scene: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  script: {
    findFirst: jest.fn(),
  },
};

jest.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}));

describe('GET /api/shots', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns demo data when no scriptId provided', async () => {
    const { GET } = await import('@/app/api/shots/route');
    const req = new NextRequest('http://localhost:3000/api/shots');
    
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data._demo).toBe(true);
    expect(data.shots).toBeDefined();
    expect(data.scenes).toBeDefined();
    expect(data.stats).toBeDefined();
  });

  it('returns shots with required fields', async () => {
    mockPrisma.shot.findMany.mockResolvedValue([
      {
        id: 'shot-1',
        sceneId: 'scene-1',
        shotIndex: 0,
        shotSize: 'Wide',
        cameraAngle: 'Eye Level',
        cameraMovement: 'Static',
        durationEstSec: 5,
        focalLengthMm: 35,
        keyStyle: 'Naturalistic',
        scene: { id: 'scene-1', sceneNumber: '1', headingRaw: 'INT. COURT - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'COURT' },
      },
    ]);
    mockPrisma.scene.findMany.mockResolvedValue([
      { id: 'scene-1', sceneNumber: '1', headingRaw: 'INT. COURT - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'COURT', _count: { shots: 1 } },
    ]);

    const { GET } = await import('@/app/api/shots/route');
    const req = new NextRequest('http://localhost:3000/api/shots?scriptId=test-script');
    
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data.shots)).toBe(true);
  });

  it('supports stats-only mode', async () => {
    mockPrisma.shot.findMany.mockResolvedValue([
      { id: 'shot-1', sceneId: 'scene-1', shotIndex: 0, shotSize: 'Wide', durationEstSec: 5 },
    ]);
    mockPrisma.scene.findMany.mockResolvedValue([
      { id: 'scene-1', sceneNumber: '1', headingRaw: 'INT. COURT - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'COURT', _count: { shots: 1 } },
    ]);
    mockPrisma.script.findFirst.mockResolvedValue({ id: 'test-script' });

    const { GET } = await import('@/app/api/shots/route');
    const req = new NextRequest('http://localhost:3000/api/shots?stats=true');
    
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalShots).toBeDefined();
    expect(data.totalDurationSec).toBeDefined();
    expect(data.scenes).toBeDefined();
  });

  it('filters by sceneId', async () => {
    mockPrisma.shot.findMany.mockResolvedValue([]);
    mockPrisma.scene.findMany.mockResolvedValue([]);
    
    const { GET } = await import('@/app/api/shots/route');
    const req = new NextRequest('http://localhost:3000/api/shots?sceneId=scene-123');
    
    const response = await GET(req);
    
    expect(response.status).toBe(200);
    expect(mockPrisma.shot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ sceneId: 'scene-123' }),
      })
    );
  });

  it('filters by scriptId', async () => {
    mockPrisma.shot.findMany.mockResolvedValue([]);
    mockPrisma.scene.findMany.mockResolvedValue([]);
    
    const { GET } = await import('@/app/api/shots/route');
    const req = new NextRequest('http://localhost:3000/api/shots?scriptId=script-123');
    
    const response = await GET(req);
    
    expect(response.status).toBe(200);
  });

  it('calculates stats correctly', async () => {
    mockPrisma.shot.findMany.mockResolvedValue([
      { id: 'shot-1', sceneId: 'scene-1', shotIndex: 0, shotSize: 'Wide', durationEstSec: 5, focalLengthMm: 35, keyStyle: 'Natural' },
      { id: 'shot-2', sceneId: 'scene-1', shotIndex: 1, shotSize: 'Medium', durationEstSec: 8, focalLengthMm: 50, keyStyle: 'Natural' },
    ]);
    mockPrisma.scene.findMany.mockResolvedValue([
      { id: 'scene-1', sceneNumber: '1', headingRaw: 'INT. COURT - DAY', intExt: 'INT', timeOfDay: 'DAY', location: 'COURT', _count: { shots: 2 } },
    ]);

    const { GET } = await import('@/app/api/shots/route');
    const req = new NextRequest('http://localhost:3000/api/shots?scriptId=test');
    
    const response = await GET(req);
    const data = await response.json();

    expect(data.stats.totalShots).toBe(2);
    expect(data.stats.totalDuration).toBe(13);
  });

  it('falls back to demo data on database error', async () => {
    mockPrisma.shot.findMany.mockRejectedValue(new Error('DB error'));
    
    const { GET } = await import('@/app/api/shots/route');
    const req = new NextRequest('http://localhost:3000/api/shots?scriptId=test');
    
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data._demo).toBe(true);
  });

  it('returns demo data when no shots in database', async () => {
    mockPrisma.shot.findMany.mockResolvedValue([]);
    mockPrisma.scene.findMany.mockResolvedValue([]);
    
    const { GET } = await import('@/app/api/shots/route');
    const req = new NextRequest('http://localhost:3000/api/shots?scriptId=test');
    
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data._demo).toBe(true);
  });
});

describe('GET /api/shots export formats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports as JSON', async () => {
    mockPrisma.shot.findMany.mockResolvedValue([
      {
        id: 'shot-1',
        sceneId: 'scene-1',
        shotIndex: 0,
        shotSize: 'Wide',
        cameraAngle: 'Eye Level',
        cameraMovement: 'Static',
        durationEstSec: 5,
        focalLengthMm: 35,
        keyStyle: 'Naturalistic',
        beatIndex: 0,
        shotText: 'Test shot',
        characters: [],
        lensType: null,
        colorTemp: null,
        isLocked: false,
        confidenceCamera: 0.8,
        confidenceLens: 0.8,
        confidenceLight: 0.8,
        confidenceDuration: 0.8,
        scene: { sceneNumber: '1', headingRaw: 'INT. COURT - DAY' },
      },
    ]);

    const { GET } = await import('@/app/api/shots/route');
    const req = new NextRequest('http://localhost:3000/api/shots?export=json');
    
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.exported_at).toBeDefined();
    expect(data.total_shots).toBeDefined();
    expect(Array.isArray(data.shots)).toBe(true);
  });

  it('exports as CSV', async () => {
    mockPrisma.shot.findMany.mockResolvedValue([
      {
        id: 'shot-1',
        sceneId: 'scene-1',
        shotIndex: 0,
        shotSize: 'Wide',
        cameraAngle: 'Eye Level',
        cameraMovement: 'Static',
        durationEstSec: 5,
        focalLengthMm: 35,
        keyStyle: 'Naturalistic',
        beatIndex: 0,
        shotText: 'Test shot',
        characters: [],
        lensType: null,
        colorTemp: null,
        isLocked: false,
        confidenceCamera: 0.8,
        confidenceLens: 0.8,
        confidenceLight: 0.8,
        confidenceDuration: 0.8,
        scene: { sceneNumber: '1', headingRaw: 'INT. COURT - DAY' },
      },
    ]);

    const { GET } = await import('@/app/api/shots/route');
    const req = new NextRequest('http://localhost:3000/api/shots?export=csv');
    
    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/csv');
    expect(response.headers.get('Content-Disposition')).toContain('.csv');
  });

  it('CSV contains correct headers', async () => {
    mockPrisma.shot.findMany.mockResolvedValue([
      {
        id: 'shot-1',
        sceneId: 'scene-1',
        shotIndex: 0,
        shotSize: 'Wide',
        cameraAngle: 'Eye Level',
        cameraMovement: 'Static',
        durationEstSec: 5,
        focalLengthMm: 35,
        keyStyle: 'Naturalistic',
        beatIndex: 0,
        shotText: 'Test shot',
        characters: [],
        lensType: null,
        colorTemp: null,
        isLocked: false,
        confidenceCamera: 0.8,
        confidenceLens: 0.8,
        confidenceLight: 0.8,
        confidenceDuration: 0.8,
        scene: { sceneNumber: '1', headingRaw: 'INT. COURT - DAY' },
      },
    ]);

    const { GET } = await import('@/app/api/shots/route');
    const req = new NextRequest('http://localhost:3000/api/shots?export=csv');
    
    const response = await GET(req);
    const text = await response.text();

    expect(text).toContain('scene_number');
    expect(text).toContain('shot_size');
    expect(text).toContain('camera_angle');
    expect(text).toContain('duration_seconds');
  });
});

describe('POST /api/shots', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 for invalid action', async () => {
    const { POST } = await import('@/app/api/shots/route');
    const req = new NextRequest('http://localhost:3000/api/shots', {
      method: 'POST',
      body: JSON.stringify({ action: 'invalid' }),
    });
    
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid action');
  });

  it('requires sceneId for generateScene action', async () => {
    const { POST } = await import('@/app/api/shots/route');
    const req = new NextRequest('http://localhost:3000/api/shots', {
      method: 'POST',
      body: JSON.stringify({ action: 'generateScene' }),
    });
    
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
  });

  it('requires scriptId for generateScript action', async () => {
    const { POST } = await import('@/app/api/shots/route');
    const req = new NextRequest('http://localhost:3000/api/shots', {
      method: 'POST',
      body: JSON.stringify({ action: 'generateScript' }),
    });
    
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
  });

  it('requires shotId for fillNull action', async () => {
    const { POST } = await import('@/app/api/shots/route');
    const req = new NextRequest('http://localhost:3000/api/shots', {
      method: 'POST',
      body: JSON.stringify({ action: 'fillNull' }),
    });
    
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
  });

  it('handles empty body gracefully', async () => {
    const { POST } = await import('@/app/api/shots/route');
    const req = new NextRequest('http://localhost:3000/api/shots', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
  });
});

describe('PATCH /api/shots', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires shotId', async () => {
    const { PATCH } = await import('@/app/api/shots/route');
    const req = new NextRequest('http://localhost:3000/api/shots', {
      method: 'PATCH',
      body: JSON.stringify({ shotSize: 'Wide' }),
    });
    
    const response = await PATCH(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('shotId required');
  });

  it('updates shot successfully', async () => {
    mockPrisma.shot.update.mockResolvedValue({ id: 'shot-1', shotSize: 'Wide' });

    const { PATCH } = await import('@/app/api/shots/route');
    const req = new NextRequest('http://localhost:3000/api/shots', {
      method: 'PATCH',
      body: JSON.stringify({ shotId: 'shot-1', shotSize: 'Close-Up' }),
    });
    
    const response = await PATCH(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    // API adds userEdited: true automatically
    expect(mockPrisma.shot.update).toHaveBeenCalledWith({
      where: { id: 'shot-1' },
      data: expect.objectContaining({ shotSize: 'Close-Up' }),
    });
  });

  it('handles database errors', async () => {
    mockPrisma.shot.update.mockRejectedValue(new Error('DB error'));

    const { PATCH } = await import('@/app/api/shots/route');
    const req = new NextRequest('http://localhost:3000/api/shots', {
      method: 'PATCH',
      body: JSON.stringify({ shotId: 'shot-1', shotSize: 'Wide' }),
    });
    
    const response = await PATCH(req);

    expect(response.status).toBe(500);
  });
});

describe('Demo data validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has varied shot sizes in demo data', async () => {
    const { GET } = await import('@/app/api/shots/route');
    const req = new NextRequest('http://localhost:3000/api/shots');
    
    const response = await GET(req);
    const data = await response.json();

    const shotSizes = new Set(data.shots.map((s: any) => s.shotSize));
    expect(shotSizes.size).toBeGreaterThan(1);
  });

  it('has varied camera angles in demo data', async () => {
    const { GET } = await import('@/app/api/shots/route');
    const req = new NextRequest('http://localhost:3000/api/shots');
    
    const response = await GET(req);
    const data = await response.json();

    const angles = new Set(data.shots.map((s: any) => s.cameraAngle));
    expect(angles.size).toBeGreaterThan(1);
  });

  it('has varied camera movements in demo data', async () => {
    const { GET } = await import('@/app/api/shots/route');
    const req = new NextRequest('http://localhost:3000/api/shots');
    
    const response = await GET(req);
    const data = await response.json();

    const movements = new Set(data.shots.map((s: any) => s.cameraMovement));
    expect(movements.size).toBeGreaterThan(1);
  });

  it('has varied shot types in demo data', async () => {
    const { GET } = await import('@/app/api/shots/route');
    const req = new NextRequest('http://localhost:3000/api/shots');
    
    const response = await GET(req);
    const data = await response.json();

    const types = new Set(data.shots.map((s: any) => s.shotType));
    expect(types.size).toBeGreaterThan(1);
  });

  it('has varied focal lengths in demo data', async () => {
    const { GET } = await import('@/app/api/shots/route');
    const req = new NextRequest('http://localhost:3000/api/shots');
    
    const response = await GET(req);
    const data = await response.json();

    const focalLengths = new Set(data.shots.map((s: any) => s.focalLengthMm));
    expect(focalLengths.size).toBeGreaterThan(1);
  });

  it('has notes in demo data', async () => {
    const { GET } = await import('@/app/api/shots/route');
    const req = new NextRequest('http://localhost:3000/api/shots');
    
    const response = await GET(req);
    const data = await response.json();

    const shotsWithNotes = data.shots.filter((s: any) => s.notes && s.notes.length > 0);
    expect(shotsWithNotes.length).toBeGreaterThan(0);
  });

  it('has varied key styles in demo data', async () => {
    const { GET } = await import('@/app/api/shots/route');
    const req = new NextRequest('http://localhost:3000/api/shots');
    
    const response = await GET(req);
    const data = await response.json();

    const keyStyles = new Set(data.shots.map((s: any) => s.keyStyle));
    expect(keyStyles.size).toBeGreaterThan(1);
  });

  it('has both INT and EXT scenes in demo data', async () => {
    const { GET } = await import('@/app/api/shots/route');
    const req = new NextRequest('http://localhost:3000/api/shots');
    
    const response = await GET(req);
    const data = await response.json();

    const intExt = new Set(data.scenes.map((s: any) => s.intExt));
    expect(intExt.has('INT')).toBe(true);
    expect(intExt.has('EXT')).toBe(true);
  });

  it('has varied time of day in demo data', async () => {
    const { GET } = await import('@/app/api/shots/route');
    const req = new NextRequest('http://localhost:3000/api/shots');
    
    const response = await GET(req);
    const data = await response.json();

    const timesOfDay = new Set(data.scenes.map((s: any) => s.timeOfDay));
    expect(timesOfDay.size).toBeGreaterThan(1);
  });

  it('demo data includes scene information', async () => {
    const { GET } = await import('@/app/api/shots/route');
    const req = new NextRequest('http://localhost:3000/api/shots');
    
    const response = await GET(req);
    const data = await response.json();

    expect(data.shots[0].scene).toBeDefined();
    expect(data.shots[0].scene.sceneNumber).toBeDefined();
    expect(data.shots[0].scene.headingRaw).toBeDefined();
  });
});
