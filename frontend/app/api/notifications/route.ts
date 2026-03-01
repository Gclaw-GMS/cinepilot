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

export async function GET() {
  try {
    const projectId = await ensureDefaultProject();
    const notifications = await prisma.notification.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('[GET /api/notifications]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
    console.error('[POST /api/notifications]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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

    const notification = await prisma.notification.update({
      where: { id: id.trim() },
      data: { status },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error('[PATCH /api/notifications]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (typeof id !== 'string' || !id.trim()) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.notification.delete({
      where: { id: id.trim() },
    });

    return NextResponse.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('[DELETE /api/notifications]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
