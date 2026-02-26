import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_USER_ID = 'default-user';

async function ensureDefaultUser(): Promise<void> {
  let user = await prisma.user.findFirst({ where: { id: DEFAULT_USER_ID } });
  if (!user) {
    await prisma.user.create({
      data: {
        id: DEFAULT_USER_ID,
        email: 'dev@cinepilot.ai',
        passwordHash: 'none',
        name: 'Dev User',
      },
    });
  }
}

export async function GET() {
  try {
    await ensureDefaultUser();
    const settings = await prisma.userSetting.findMany({
      where: { userId: DEFAULT_USER_ID },
    });
    const result: Record<string, unknown> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('[GET /api/settings]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, key, value, settings: bulkSettings } = body;

    if (action === 'bulk') {
      const settingsRecord = bulkSettings as Record<string, unknown> | undefined;
      if (
        !settingsRecord ||
        typeof settingsRecord !== 'object' ||
        Array.isArray(settingsRecord)
      ) {
        return NextResponse.json(
          { error: 'settings must be a Record<string, any>' },
          { status: 400 }
        );
      }

      await ensureDefaultUser();

      for (const [k, v] of Object.entries(settingsRecord)) {
        await prisma.userSetting.upsert({
          where: {
            userId_key: { userId: DEFAULT_USER_ID, key: k },
          },
          create: { userId: DEFAULT_USER_ID, key: k, value: v as object },
          update: { value: v as object },
        });
      }

      return NextResponse.json({ success: true });
    }

    if (typeof key !== 'string' || !key.trim()) {
      return NextResponse.json({ error: 'key is required' }, { status: 400 });
    }

    await ensureDefaultUser();

    await prisma.userSetting.upsert({
      where: {
        userId_key: { userId: DEFAULT_USER_ID, key: key.trim() },
      },
      create: {
        userId: DEFAULT_USER_ID,
        key: key.trim(),
        value: value ?? null,
      },
      update: { value: value ?? null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/settings]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
