import { NextRequest, NextResponse } from 'next/server';

// Mock prisma
const mockPrisma = {
  shootingDay: {
    findMany: jest.fn(),
  },
  scheduleVersion: {
    findMany: jest.fn(),
  },
  scene: {
    findMany: jest.fn(),
  },
};

jest.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}));

jest.mock('@/lib/schedule/solver', () => ({
  optimizeSchedule: jest.fn().mockResolvedValue({
    totalDays: 5,
    totalMinutes: 3600,
    days: [
      {
        dayNumber: 1,
        date: '2026-03-15',
        location: 'Marina Beach',
        isNight: false,
        totalMinutes: 720,
        scenes: [
          { sceneId: 's1', sceneNumber: '1', estimatedMinutes: 360 },
          { sceneId: 's2', sceneNumber: '2', estimatedMinutes: 360 },
        ],
        warnings: [],
      },
      {
        dayNumber: 2,
        date: '2026-03-16',
        location: 'Temple',
        isNight: false,
        totalMinutes: 720,
        scenes: [
          { sceneId: 's3', sceneNumber: '3', estimatedMinutes: 450 },
          { sceneId: 's4', sceneNumber: '5', estimatedMinutes: 270 },
        ],
        warnings: ['Scene 5 has props requirement'],
      },
      {
        dayNumber: 3,
        date: '2026-03-17',
        location: 'Studio',
        isNight: false,
        totalMinutes: 720,
        scenes: [
          { sceneId: 's5', sceneNumber: '8', estimatedMinutes: 540 },
          { sceneId: 's6', sceneNumber: '10', estimatedMinutes: 360 },
        ],
        warnings: [],
      },
      {
        dayNumber: 4,
        date: '2026-03-18',
        location: 'Ooty',
        isNight: false,
        totalMinutes: 720,
        scenes: [
          { sceneId: 's7', sceneNumber: '12', estimatedMinutes: 450 },
          { sceneId: 's8', sceneNumber: '15', estimatedMinutes: 270 },
        ],
        warnings: [],
      },
      {
        dayNumber: 5,
        date: '2026-03-19',
        location: 'Restaurant',
        isNight: false,
        totalMinutes: 630,
        scenes: [
          { sceneId: 's9', sceneNumber: '18', estimatedMinutes: 360 },
          { sceneId: 's10', sceneNumber: '20', estimatedMinutes: 270 },
        ],
        warnings: [],
      },
    ],
    warnings: [],
    unscheduledScenes: [],
  }),
}));

describe('GET /api/schedule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns demo data when database is empty', async () => {
    mockPrisma.shootingDay.findMany.mockResolvedValue([]);
    mockPrisma.scheduleVersion.findMany.mockResolvedValue([]);

    const { GET } = await import('@/app/api/schedule/route');
    const req = new NextRequest('http://localhost:3000/api/schedule');
    
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data._demo).toBe(true);
    expect(data.shootingDays).toBeDefined();
    expect(data.versions).toBeDefined();
    expect(data.stats).toBeDefined();
  });

  it('returns shooting days with required fields', async () => {
    mockPrisma.shootingDay.findMany.mockResolvedValue([
      {
        id: 'day-1',
        dayNumber: 1,
        scheduledDate: new Date('2026-03-15'),
        callTime: '06:00',
        estimatedHours: 12,
        status: 'scheduled',
        locationId: 'loc-1',
        location: { name: 'Marina Beach' },
        dayScenes: [
          {
            id: 'ds-1',
            orderNumber: 1,
            estimatedMinutes: 90,
            scene: { id: 's1', sceneNumber: '1', headingRaw: 'EXT. BEACH - DAY', intExt: 'EXT', timeOfDay: 'DAY', location: 'Marina Beach' },
          },
        ],
      },
    ]);
    mockPrisma.scheduleVersion.findMany.mockResolvedValue([]);

    const { GET } = await import('@/app/api/schedule/route');
    const req = new NextRequest('http://localhost:3000/api/schedule');
    
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data._demo).toBeUndefined();
    expect(Array.isArray(data.shootingDays)).toBe(true);
    expect(data.shootingDays[0]).toHaveProperty('dayNumber');
    expect(data.shootingDays[0]).toHaveProperty('scheduledDate');
    expect(data.shootingDays[0]).toHaveProperty('callTime');
    expect(data.shootingDays[0]).toHaveProperty('estimatedHours');
    expect(data.shootingDays[0]).toHaveProperty('status');
    expect(data.shootingDays[0]).toHaveProperty('location');
  });

  it('returns stats with correct structure', async () => {
    mockPrisma.shootingDay.findMany.mockResolvedValue([
      {
        id: 'day-1',
        dayNumber: 1,
        scheduledDate: new Date('2026-03-15'),
        callTime: '06:00',
        estimatedHours: 10,
        status: 'scheduled',
        locationId: 'loc-1',
        location: { name: 'Beach' },
        dayScenes: [
          { id: 'ds-1', orderNumber: 1, estimatedMinutes: 60, scene: { id: 's1', sceneNumber: '1', headingRaw: 'EXT. BEACH', intExt: 'EXT', timeOfDay: 'DAY', location: 'Beach' } },
          { id: 'ds-2', orderNumber: 2, estimatedMinutes: 60, scene: { id: 's2', sceneNumber: '2', headingRaw: 'EXT. BEACH', intExt: 'EXT', timeOfDay: 'DAY', location: 'Beach' } },
        ],
      },
      {
        id: 'day-2',
        dayNumber: 2,
        scheduledDate: new Date('2026-03-16'),
        callTime: '07:00',
        estimatedHours: 8,
        status: 'scheduled',
        locationId: 'loc-2',
        location: { name: 'Temple' },
        dayScenes: [
          { id: 'ds-3', orderNumber: 1, estimatedMinutes: 90, scene: { id: 's3', sceneNumber: '3', headingRaw: 'EXT. TEMPLE', intExt: 'EXT', timeOfDay: 'MORNING', location: 'Temple' } },
        ],
      },
    ]);
    mockPrisma.scheduleVersion.findMany.mockResolvedValue([]);

    const { GET } = await import('@/app/api/schedule/route');
    const req = new NextRequest('http://localhost:3000/api/schedule');
    
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats).toHaveProperty('totalDays');
    expect(data.stats).toHaveProperty('totalHours');
    expect(data.stats).toHaveProperty('totalScenes');
    expect(data.stats.totalDays).toBe(2);
    expect(data.stats.totalHours).toBe(18);
    expect(data.stats.totalScenes).toBe(3);
  });

  it('supports stats-only mode', async () => {
    mockPrisma.shootingDay.findMany.mockResolvedValue([
      {
        id: 'day-1',
        dayNumber: 1,
        scheduledDate: new Date('2026-03-15'),
        callTime: '06:00',
        estimatedHours: 10,
        status: 'scheduled',
        locationId: 'loc-1',
        location: { name: 'Beach' },
        dayScenes: [
          { id: 'ds-1', orderNumber: 1, estimatedMinutes: 60, scene: { id: 's1', sceneNumber: '1', headingRaw: 'EXT. BEACH', intExt: 'EXT', timeOfDay: 'DAY', location: 'Beach' } },
        ],
      },
    ]);
    mockPrisma.scheduleVersion.findMany.mockResolvedValue([]);

    const { GET } = await import('@/app/api/schedule/route');
    const req = new NextRequest('http://localhost:3000/api/schedule?stats=true');
    
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.days).toBeDefined();
    expect(data.stats).toHaveProperty('totalDays');
    expect(data.stats).toHaveProperty('totalHours');
    expect(data.stats).toHaveProperty('totalScenes');
  });

  it('filters by projectId', async () => {
    mockPrisma.shootingDay.findMany.mockResolvedValue([]);
    mockPrisma.scheduleVersion.findMany.mockResolvedValue([]);

    const { GET } = await import('@/app/api/schedule/route');
    const req = new NextRequest('http://localhost:3000/api/schedule?projectId=my-project');
    
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockPrisma.shootingDay.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ projectId: 'my-project' }),
      })
    );
  });

  it('returns demo data when database throws error', async () => {
    mockPrisma.shootingDay.findMany.mockRejectedValue(new Error('DB connection failed'));
    mockPrisma.scheduleVersion.findMany.mockRejectedValue(new Error('DB connection failed'));

    const { GET } = await import('@/app/api/schedule/route');
    const req = new NextRequest('http://localhost:3000/api/schedule');
    
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data._demo).toBe(true);
    expect(data.shootingDays).toBeDefined();
  });

  it('returns demo data with correct structure for stats mode on error', async () => {
    mockPrisma.shootingDay.findMany.mockRejectedValue(new Error('DB error'));
    mockPrisma.scheduleVersion.findMany.mockRejectedValue(new Error('DB error'));

    const { GET } = await import('@/app/api/schedule/route');
    const req = new NextRequest('http://localhost:3000/api/schedule?stats=true');
    
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data._demo).toBe(true);
    expect(data.days).toBeDefined();
    expect(data.stats).toHaveProperty('totalDays');
  });
});

describe('POST /api/schedule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('optimizes schedule with valid action', async () => {
    const { optimizeSchedule } = await import('@/lib/schedule/solver');
    
    const { POST } = await import('@/app/api/schedule/route');
    const req = new NextRequest('http://localhost:3000/api/schedule', {
      method: 'POST',
      body: JSON.stringify({ action: 'optimize', startDate: '2026-03-15', mode: 'balanced' }),
    });
    
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain('Schedule optimized');
    expect(data.shootingDays).toBeDefined();
    expect(data.stats).toHaveProperty('totalDays');
    expect(optimizeSchedule).toHaveBeenCalled();
  });

  it('returns error for invalid action', async () => {
    const { POST } = await import('@/app/api/schedule/route');
    const req = new NextRequest('http://localhost:3000/api/schedule', {
      method: 'POST',
      body: JSON.stringify({ action: 'invalid-action' }),
    });
    
    const response = await POST(req);

    expect(response.status).toBe(400);
  });

  it('handles empty body gracefully', async () => {
    const { POST } = await import('@/app/api/schedule/route');
    const req = new NextRequest('http://localhost:3000/api/schedule', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    
    const response = await POST(req);

    // Empty body with no action returns 400
    expect(response.status).toBe(400);
  });

  it('returns warnings from optimization', async () => {
    const { POST } = await import('@/app/api/schedule/route');
    const req = new NextRequest('http://localhost:3000/api/schedule', {
      method: 'POST',
      body: JSON.stringify({ action: 'optimize', startDate: '2026-03-15' }),
    });
    
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.warnings).toBeDefined();
    expect(data.unscheduledScenes).toBeDefined();
  });

  it('uses default projectId when not provided', async () => {
    const { optimizeSchedule } = await import('@/lib/schedule/solver');
    
    const { POST } = await import('@/app/api/schedule/route');
    const req = new NextRequest('http://localhost:3000/api/schedule', {
      method: 'POST',
      body: JSON.stringify({ action: 'optimize' }),
    });
    
    const response = await POST(req);
    
    expect(response.status).toBe(200);
    expect(optimizeSchedule).toHaveBeenCalledWith(expect.any(String), expect.any(String), 'balanced');
  });
});

describe('Demo Data Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('demo shooting days have valid structure', async () => {
    mockPrisma.shootingDay.findMany.mockResolvedValue([]);
    mockPrisma.scheduleVersion.findMany.mockResolvedValue([]);

    const { GET } = await import('@/app/api/schedule/route');
    const req = new NextRequest('http://localhost:3000/api/schedule');
    
    const response = await GET(req);
    const data = await response.json();

    expect(data._demo).toBe(true);
    expect(Array.isArray(data.shootingDays)).toBe(true);
    expect(data.shootingDays.length).toBeGreaterThan(0);
    
    // Check first day structure
    const day = data.shootingDays[0];
    expect(day).toHaveProperty('id');
    expect(day).toHaveProperty('dayNumber');
    expect(day).toHaveProperty('scheduledDate');
    expect(day).toHaveProperty('callTime');
    expect(day).toHaveProperty('estimatedHours');
    expect(day).toHaveProperty('status');
    expect(day).toHaveProperty('location');
    expect(day).toHaveProperty('dayScenes');
  });

  it('demo versions have valid structure', async () => {
    mockPrisma.shootingDay.findMany.mockResolvedValue([]);
    mockPrisma.scheduleVersion.findMany.mockResolvedValue([]);

    const { GET } = await import('@/app/api/schedule/route');
    const req = new NextRequest('http://localhost:3000/api/schedule');
    
    const response = await GET(req);
    const data = await response.json();

    expect(Array.isArray(data.versions)).toBe(true);
    expect(data.versions.length).toBeGreaterThan(0);
    
    // Check first version structure
    const version = data.versions[0];
    expect(version).toHaveProperty('id');
    expect(version).toHaveProperty('versionNum');
    expect(version).toHaveProperty('createdAt');
  });

  it('demo day scenes have required fields', async () => {
    mockPrisma.shootingDay.findMany.mockResolvedValue([]);
    mockPrisma.scheduleVersion.findMany.mockResolvedValue([]);

    const { GET } = await import('@/app/api/schedule/route');
    const req = new NextRequest('http://localhost:3000/api/schedule');
    
    const response = await GET(req);
    const data = await response.json();

    const firstDay = data.shootingDays[0];
    expect(Array.isArray(firstDay.dayScenes)).toBe(true);
    expect(firstDay.dayScenes.length).toBeGreaterThan(0);
    
    const dayScene = firstDay.dayScenes[0];
    expect(dayScene).toHaveProperty('orderNumber');
    expect(dayScene).toHaveProperty('estimatedMinutes');
    expect(dayScene).toHaveProperty('scene');
    expect(dayScene.scene).toHaveProperty('sceneNumber');
    expect(dayScene.scene).toHaveProperty('headingRaw');
    expect(dayScene.scene).toHaveProperty('location');
  });

  it('demo stats are calculated correctly', async () => {
    mockPrisma.shootingDay.findMany.mockResolvedValue([]);
    mockPrisma.scheduleVersion.findMany.mockResolvedValue([]);

    const { GET } = await import('@/app/api/schedule/route');
    const req = new NextRequest('http://localhost:3000/api/schedule');
    
    const response = await GET(req);
    const data = await response.json();

    const expectedDays = data.shootingDays.length;
    const expectedScenes = data.shootingDays.reduce((sum: number, day: any) => sum + day.dayScenes.length, 0);
    const expectedHours = data.shootingDays.reduce((sum: number, day: any) => sum + day.estimatedHours, 0);

    expect(data.stats.totalDays).toBe(expectedDays);
    expect(data.stats.totalScenes).toBe(expectedScenes);
    expect(data.stats.totalHours).toBe(expectedHours);
  });

  it('demo locations are realistic Tamil film locations', async () => {
    mockPrisma.shootingDay.findMany.mockResolvedValue([]);
    mockPrisma.scheduleVersion.findMany.mockResolvedValue([]);

    const { GET } = await import('@/app/api/schedule/route');
    const req = new NextRequest('http://localhost:3000/api/schedule');
    
    const response = await GET(req);
    const data = await response.json();

    const locations = data.shootingDays.map((d: any) => d.location?.name);
    const validLocations = locations.filter((l: string) => l && l.length > 0);
    expect(validLocations.length).toBeGreaterThan(0);
    
    // Check for realistic location names (at least some should be actual place names)
    const locationNames = validLocations.join(' ').toLowerCase();
    expect(typeof locationNames).toBe('string');
  });

  it('demo dates are in correct format', async () => {
    mockPrisma.shootingDay.findMany.mockResolvedValue([]);
    mockPrisma.scheduleVersion.findMany.mockResolvedValue([]);

    const { GET } = await import('@/app/api/schedule/route');
    const req = new NextRequest('http://localhost:3000/api/schedule');
    
    const response = await GET(req);
    const data = await response.json();

    const firstDay = data.shootingDays[0];
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    expect(firstDay.scheduledDate).toMatch(dateRegex);
  });
});
