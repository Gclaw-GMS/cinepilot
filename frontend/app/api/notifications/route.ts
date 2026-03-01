import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo notifications data for fallback when database is not connected
interface DemoNotification {
  id: string;
  projectId: string;
  channel: string;
  recipient: string | null;
  title: string;
  body: string;
  status: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

const DEMO_NOTIFICATIONS: DemoNotification[] = [
  {
    id: 'demo-1',
    projectId: DEFAULT_PROJECT_ID,
    channel: 'whatsapp',
    recipient: '+91 98765 43210',
    title: 'Call Time Updated',
    body: 'Shooting schedule changed - Day 5 now starts at 5:00 AM instead of 6:00 AM',
    status: 'unread',
    metadata: { priority: 'high', shootingDay: 5 },
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-2',
    projectId: DEFAULT_PROJECT_ID,
    channel: 'whatsapp',
    recipient: '+91 98765 43211',
    title: 'Location Change',
    body: 'Day 3 shoot moved from Marina Beach to ECR Beach due to weather',
    status: 'unread',
    metadata: { priority: 'high', shootingDay: 3 },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-3',
    projectId: DEFAULT_PROJECT_ID,
    channel: 'telegram',
    recipient: 'Director',
    title: 'Script Update',
    body: 'New version of Scene 12-15 uploaded to the system',
    status: 'unread',
    metadata: { priority: 'medium', scenes: [12, 13, 14, 15] },
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-4',
    projectId: DEFAULT_PROJECT_ID,
    channel: 'whatsapp',
    recipient: '+91 98765 43210',
    title: 'Equipment Ready',
    body: 'ARRI Alexa Mini LF and lenses checked and ready for tomorrow shoot',
    status: 'read',
    metadata: { priority: 'low', equipment: ['ARRI Alexa Mini LF', 'Cooke S7/i Full Frame Prime lenses'] },
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-5',
    projectId: DEFAULT_PROJECT_ID,
    channel: 'email',
    recipient: 'producer@film.com',
    title: 'Budget Approval',
    body: 'VFX budget for sequence 7 approved. Can proceed with pre-visualization.',
    status: 'read',
    metadata: { priority: 'medium', amount: 2500000 },
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-6',
    projectId: DEFAULT_PROJECT_ID,
    channel: 'whatsapp',
    recipient: '+91 98765 43212',
    title: 'Catering Update',
    body: 'South Indian vegetarian menu confirmed for 60 crew members on Day 4',
    status: 'read',
    metadata: { priority: 'low', menu: 'South Indian vegetarian', count: 60 },
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
  },
];

// In-memory store for demo mode
let notificationsStore: DemoNotification[] = [...DEMO_NOTIFICATIONS];

// Helper to check database connection
async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    await prisma.$disconnect();
    return true;
  } catch {
    return false;
  }
}

async function ensureDefaultProject(): Promise<string> {
  try {
    let user = await prisma.user.findFirst({ where: { id: 'default-user' } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: 'default-user',
          email: 'dev@cinepilot.ai',
          passwordHash: 'none',
          name: 'Dev User',
        },
      });
    }
    let project = await prisma.project.findFirst({ where: { userId: user.id } });
    if (!project) {
      project = await prisma.project.create({
        data: { name: 'Default Project', userId: user.id },
      });
    }
    return project.id;
  } catch {
    return DEFAULT_PROJECT_ID;
  }
}

// GET /api/notifications - Get all notifications
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId') || DEFAULT_PROJECT_ID;
  const channel = req.nextUrl.searchParams.get('channel');
  const status = req.nextUrl.searchParams.get('status');

  const isDbConnected = await checkDbConnection();

  if (!isDbConnected) {
    // Return demo data
    let filtered = notificationsStore.filter(n => n.projectId === projectId);
    if (channel && channel !== 'all') {
      filtered = filtered.filter(n => n.channel === channel);
    }
    if (status && status !== 'all') {
      filtered = filtered.filter(n => n.status === status);
    }
    // Sort by createdAt descending (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return NextResponse.json({ 
      data: filtered,
      isDemoMode: true 
    });
  }

  try {
    const project = await ensureDefaultProject();
    
    const where: any = { projectId: project };
    if (channel && channel !== 'all') {
      where.channel = channel;
    }
    if (status && status !== 'all') {
      where.status = status;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ 
      data: notifications,
      isDemoMode: false 
    });
  } catch (error) {
    console.error('[GET /api/notifications]', error);
    // Fallback to demo data on error
    let filtered = notificationsStore.filter(n => n.projectId === projectId);
    if (channel && channel !== 'all') {
      filtered = filtered.filter(n => n.channel === channel);
    }
    if (status && status !== 'all') {
      filtered = filtered.filter(n => n.status === status);
    }
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return NextResponse.json({ 
      data: filtered,
      isDemoMode: true 
    });
  }
}

// POST /api/notifications - Create a new notification
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { channel, recipient, title, body: bodyText, metadata } = body;

    if (typeof channel !== 'string' || !channel.trim()) {
      return NextResponse.json({ error: 'channel is required' }, { status: 400 });
    }
    if (typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }
    if (typeof bodyText !== 'string' || !bodyText.trim()) {
      return NextResponse.json({ error: 'body is required' }, { status: 400 });
    }

    const isDbConnected = await checkDbConnection();

    if (!isDbConnected) {
      // Add to demo store
      const recipientValue = typeof recipient === 'string' ? recipient.trim() || undefined : undefined;
      const newNotification = {
        id: `demo-${Date.now()}`,
        projectId: DEFAULT_PROJECT_ID,
        channel: channel.trim(),
        recipient: recipientValue ?? null,
        title: title.trim(),
        body: bodyText.trim(),
        status: 'unread' as const,
        metadata: metadata ?? null,
        createdAt: new Date().toISOString(),
      };
      notificationsStore.push(newNotification);
      
      return NextResponse.json({ 
        data: newNotification,
        isDemoMode: true 
      }, { status: 201 });
    }

    const projectId = await ensureDefaultProject();

    const notification = await prisma.notification.create({
      data: {
        projectId,
        channel: channel.trim(),
        recipient: typeof recipient === 'string' ? recipient.trim() || null : null,
        title: title.trim(),
        body: bodyText.trim(),
        metadata: metadata ?? null,
      },
    });

    return NextResponse.json({ 
      data: notification,
      isDemoMode: false 
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/notifications]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/notifications - Update notification status
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (typeof id !== 'string' || !id.trim()) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    if (typeof status !== 'string' || !['read', 'unread'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be "read" or "unread"' },
        { status: 400 }
      );
    }

    const isDbConnected = await checkDbConnection();

    if (!isDbConnected || id.startsWith('demo-')) {
      // Update in demo store
      const index = notificationsStore.findIndex(n => n.id === id);
      if (index === -1) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      }
      notificationsStore[index] = {
        ...notificationsStore[index],
        status,
      };
      
      return NextResponse.json({ 
        data: notificationsStore[index],
        isDemoMode: true 
      });
    }

    const notification = await prisma.notification.update({
      where: { id: id.trim() },
      data: { status },
    });

    return NextResponse.json({ 
      data: notification,
      isDemoMode: false 
    });
  } catch (error) {
    console.error('[PATCH /api/notifications]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/notifications - Delete a notification
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id query param is required' }, { status: 400 });
  }

  const isDbConnected = await checkDbConnection();

  if (!isDbConnected || id.startsWith('demo-')) {
    // Remove from demo store
    const index = notificationsStore.findIndex(n => n.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }
    notificationsStore.splice(index, 1);
    
    return NextResponse.json({ 
      success: true,
      message: 'Notification deleted',
      isDemoMode: true 
    });
  }

  try {
    await prisma.notification.delete({
      where: { id: id.trim() },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Notification deleted',
      isDemoMode: false 
    });
  } catch (error) {
    console.error('[DELETE /api/notifications]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
