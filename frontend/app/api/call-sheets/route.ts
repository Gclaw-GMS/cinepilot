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

export type CallSheetContent = {
  callTime?: string;
  wrapTime?: string;
  location?: string;
  locationAddress?: string;
  scenes?: string[];
  crewCalls?: Array<{ name: string; role: string; department?: string; callTime?: string }>;
  weather?: string;
};

export async function GET() {
  try {
    const projectId = await ensureDefaultProject();
    const callSheets = await prisma.callSheet.findMany({
      where: { projectId },
      include: { shootingDay: true },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(callSheets);
  } catch (error) {
    console.error('[GET /api/call-sheets]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, shootingDayId, date, title, content, notes } = body;

    const projectId = await ensureDefaultProject();

    if (action === 'generate') {
      const dayId = typeof shootingDayId === 'string' ? shootingDayId : body.shootingDayId;
      if (!dayId) {
        return NextResponse.json(
          { error: 'shootingDayId is required for generate action' },
          { status: 400 }
        );
      }

      const shootingDay = await prisma.shootingDay.findFirst({
        where: { id: dayId, projectId },
        include: {
          dayScenes: {
            include: {
              scene: {
                select: {
                  sceneNumber: true,
                  location: true,
                  headingRaw: true,
                  intExt: true,
                  timeOfDay: true,
                },
              },
            },
            orderBy: { orderNumber: 'asc' },
          },
          location: true,
        },
      });

      if (!shootingDay) {
        return NextResponse.json(
          { error: 'Shooting day not found' },
          { status: 404 }
        );
      }

      const crew = await prisma.crew.findMany({
        where: { projectId },
        orderBy: { role: 'asc' },
      });

      const scenes = shootingDay.dayScenes.map((ds) =>
        String(ds.scene.sceneNumber ?? '')
      );
      const crewCalls = crew.map((c) => ({
        name: c.name,
        role: c.role,
        department: c.department ?? undefined,
        callTime: shootingDay.callTime ?? '06:00',
      }));

      const contentJson: CallSheetContent = {
        callTime: shootingDay.callTime ?? '06:00',
        wrapTime: undefined,
        location: shootingDay.location?.name ?? 'TBD',
        locationAddress: shootingDay.location?.address ?? undefined,
        scenes,
        crewCalls,
        weather: undefined,
      };

      const sheetDate = shootingDay.scheduledDate
        ? new Date(shootingDay.scheduledDate)
        : new Date();

      const callSheet = await prisma.callSheet.create({
        data: {
          projectId,
          shootingDayId: shootingDay.id,
          title: title ?? `Day ${shootingDay.dayNumber} Call Sheet`,
          date: sheetDate,
          content: contentJson as object,
          notes: shootingDay.notes ?? undefined,
        },
        include: { shootingDay: true },
      });

      return NextResponse.json(callSheet);
    }

    const dateVal = date ?? new Date().toISOString().split('T')[0];
    const parsedDate = typeof dateVal === 'string' ? new Date(dateVal) : new Date(dateVal);

    const callSheet = await prisma.callSheet.create({
      data: {
        projectId,
        shootingDayId: shootingDayId ?? undefined,
        title: typeof title === 'string' ? title : undefined,
        date: parsedDate,
        content: content != null ? (typeof content === 'object' ? content : {}) : undefined,
        notes: typeof notes === 'string' ? notes : undefined,
      },
      include: { shootingDay: true },
    });

    return NextResponse.json(callSheet);
  } catch (error) {
    console.error('[POST /api/call-sheets]', error);
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

    await prisma.callSheet.delete({
      where: { id: id.trim() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/call-sheets]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
