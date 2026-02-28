import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo activity data
const DEMO_ACTIVITY = [
  { id: 1, projectId: DEFAULT_PROJECT_ID, activityType: 'note_created', description: 'New todo note added', userEmail: 'director@cinepilot.ai', metadata: {}, createdAt: new Date().toISOString() },
  { id: 2, projectId: DEFAULT_PROJECT_ID, activityType: 'script_uploaded', description: 'Script "Kaadhal Enbadhu" uploaded', userEmail: 'writer@cinepilot.ai', metadata: { scenes: 47 }, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 3, projectId: DEFAULT_PROJECT_ID, activityType: 'budget_updated', description: 'Budget increased by ₹50L', userEmail: 'producer@cinepilot.ai', metadata: { oldBudget: 80000000, newBudget: 85000000 }, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 4, projectId: DEFAULT_PROJECT_ID, activityType: 'crew_added', description: 'New crew member: DOP Santhosh', userEmail: 'lineproducer@cinepilot.ai', metadata: { role: 'DOP' }, createdAt: new Date(Date.now() - 10800000).toISOString() },
  { id: 5, projectId: DEFAULT_PROJECT_ID, activityType: 'location_confirmed', description: 'Marina Beach location confirmed', userEmail: 'locationmanager@cinepilot.ai', metadata: { dates: 'March 5-7' }, createdAt: new Date(Date.now() - 14400000).toISOString() },
  { id: 6, projectId: DEFAULT_PROJECT_ID, activityType: 'scene_completed', description: 'Scene 12 shot completed', userEmail: 'firstad@cinepilot.ai', metadata: { sceneNumber: 12, duration: '3:45' }, createdAt: new Date(Date.now() - 18000000).toISOString() },
  { id: 7, projectId: DEFAULT_PROJECT_ID, activityType: 'equipment_rented', description: 'Alexa 35 camera package rented', userEmail: 'productionmanager@cinepilot.ai', metadata: { vendor: 'Film Gear Rentals', cost: 150000 }, createdAt: new Date(Date.now() - 21600000).toISOString() },
];

// In-memory store for demo mode
let activityStore = [...DEMO_ACTIVITY];

// GET /api/activity - Get activity log (also handles /api/activity/stats)
export async function GET(req: NextRequest) {
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');
  const type = req.nextUrl.searchParams.get('type');
  const stats = req.nextUrl.searchParams.get('stats');

  // Handle stats request
  if (stats === 'true') {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const today = activityStore.filter(a => new Date(a.createdAt).getTime() > now.getTime() - oneDay);
    const thisWeek = activityStore.filter(a => new Date(a.createdAt).getTime() > now.getTime() - 7 * oneDay);

    const byType = activityStore.reduce((acc, a) => {
      acc[a.activityType] = (acc[a.activityType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      total: activityStore.length,
      today: today.length,
      thisWeek: thisWeek.length,
      byType,
    });
  }

  // Regular activity log request
  let filtered = activityStore;
  if (type && type !== 'all') {
    filtered = activityStore.filter(a => a.activityType === type);
  }
  return NextResponse.json(filtered.slice(0, limit));
}

// POST /api/activity - Log new activity
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { activityType, description, userEmail, metadata, projectId = DEFAULT_PROJECT_ID } = body;

    if (!activityType || typeof activityType !== 'string') {
      return NextResponse.json({ error: 'Activity type is required' }, { status: 400 });
    }

    const newActivity = {
      id: Date.now(),
      projectId,
      activityType,
      description: description || '',
      userEmail: userEmail || '',
      metadata: metadata || {},
      createdAt: new Date().toISOString(),
    };
    
    activityStore.unshift(newActivity);
    return NextResponse.json(newActivity, { status: 201 });
  } catch (error) {
    console.error('[POST /api/activity]', error);
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}
