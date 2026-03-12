import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

async function ensureDefaultProject(): Promise<string> {
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
}

// Demo notifications data for when database is not connected
const DEMO_NOTIFICATIONS = [
  {
    id: 'demo-1',
    projectId: 'default-project',
    channel: 'app',
    recipient: null,
    title: 'Shooting Schedule Updated',
    body: 'Day 15 schedule has been modified. Please check the updated call sheet for tomorrow\'s shoot at Chennai studio.',
    status: 'unread',
    priority: 'high',
    metadata: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'demo-2',
    projectId: 'default-project',
    channel: 'email',
    recipient: 'crew@cinepilot.ai',
    title: 'Call Sheet - Day 14',
    body: 'The call sheet for tomorrow\'s shoot (Factory Sequence) is now available. Call time: 6:00 AM.',
    status: 'sent',
    priority: 'high',
    metadata: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'demo-3',
    projectId: 'default-project',
    channel: 'whatsapp',
    recipient: '+91 98765 43210',
    title: 'Location Change Alert',
    body: 'Tomorrow\'s shoot location changed from Studio A to Outdoor Set B due to weather conditions.',
    status: 'sent',
    priority: 'medium',
    metadata: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'demo-4',
    projectId: 'default-project',
    channel: 'app',
    recipient: null,
    title: 'Budget Approval Required',
    body: 'Equipment rental overbudget by ₹2.5L. Requires producer approval before proceeding.',
    status: 'unread',
    priority: 'high',
    metadata: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: 'demo-5',
    projectId: 'default-project',
    channel: 'email',
    recipient: 'vendor@equipment.com',
    title: 'Equipment Booking Confirmation',
    body: 'Your booking for ARRI Alexa Mini has been confirmed for dates Feb 20-25.',
    status: 'read',
    priority: 'low',
    metadata: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'demo-6',
    projectId: 'default-project',
    channel: 'sms',
    recipient: '+91 98765 43211',
    title: 'Emergency: Shoot Postponed',
    body: 'Due to heavy rain, today\'s outdoor shoot has been postponed. Report at 10 AM tomorrow.',
    status: 'failed',
    priority: 'high',
    metadata: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
  {
    id: 'demo-7',
    projectId: 'default-project',
    channel: 'app',
    recipient: null,
    title: 'New Comment on Scene 42',
    body: 'Director added a note on scene 42 - "Need more emotional depth in this dialogue exchange."',
    status: 'read',
    priority: 'low',
    metadata: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: 'demo-8',
    projectId: 'default-project',
    channel: 'whatsapp',
    recipient: '+91 98765 43210',
    title: 'Catering Confirmation',
    body: 'Day 16 catering has been confirmed. 60 crew members, veg + non-veg options.',
    status: 'sent',
    priority: 'low',
    metadata: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
];

// In-memory store for demo mode
let demoNotifications = [...DEMO_NOTIFICATIONS];
let demoNextId = DEMO_NOTIFICATIONS.length + 1;

export async function GET() {
  try {
    const projectId = await ensureDefaultProject();
    const notifications = await prisma.notification.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    
    // If no notifications exist, return demo data
    if (notifications.length === 0) {
      return NextResponse.json({ data: demoNotifications, isDemoMode: true });
    }
    
    return NextResponse.json({ data: notifications, isDemoMode: false });
  } catch (error) {
    console.error('[GET /api/notifications] Using demo data - database not connected');
    return NextResponse.json({ data: demoNotifications, isDemoMode: true });
  }
}

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
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

    return NextResponse.json(notification);
  } catch (error) {
    // Demo mode: create notification in demo data
    console.log('[POST /api/notifications] Using demo data - database not connected');
    
    // Use body from try block (already parsed)
    const { channel, recipient, title, body: bodyText, metadata } = body || {};
    
    const newNotification = {
      id: `demo-${demoNextId++}`,
      projectId: 'default-project',
      channel: channel || 'app',
      recipient: recipient || null,
      title: title || 'Notification',
      body: bodyText || '',
      status: 'sent' as const,
      priority: 'medium' as const,
      metadata: metadata ?? null,
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
    };
    
    demoNotifications = [newNotification, ...demoNotifications];
    return NextResponse.json(newNotification);
  }
}

export async function PATCH(req: NextRequest) {
  let body;
  try {
    body = await req.json();
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

    const notification = await prisma.notification.update({
      where: { id: id.trim() },
      data: { status },
    });

    return NextResponse.json(notification);
  } catch (error) {
    // Demo mode: update in-memory demo data
    console.log('[PATCH /api/notifications] Using demo data - database not connected');
    
    // Use body from try block (already parsed)
    const { id, status } = body || {};
    
    if (typeof id !== 'string' || !id.trim()) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    
    const index = demoNotifications.findIndex(n => n.id === id.trim());
    if (index === -1) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }
    
    demoNotifications[index] = {
      ...demoNotifications[index],
      status: status || demoNotifications[index].status,
    };
    
    return NextResponse.json(demoNotifications[index]);
  }
}

export async function DELETE(req: NextRequest) {
  let body;
  try {
    body = await req.json();
    const { id } = body;

    if (typeof id !== 'string' || !id.trim()) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.notification.delete({
      where: { id: id.trim() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Demo mode: remove from in-memory demo data
    console.log('[DELETE /api/notifications] Using demo data - database not connected');
    
    // Use body from try block (already parsed)
    const { id } = body || {};
    
    if (typeof id !== 'string' || !id.trim()) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    
    const index = demoNotifications.findIndex(n => n.id === id.trim());
    if (index === -1) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }
    
    demoNotifications = demoNotifications.filter(n => n.id !== id.trim());
    
    return NextResponse.json({ success: true });
  }
}
