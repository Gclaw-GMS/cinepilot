import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

const DEFAULT_USER_ID = 'default-user';

// Demo settings for when database is unavailable
const DEMO_SETTINGS = {
  language: 'en',
  theme: 'dark',
  notifications: true,
  emailNotifications: true,
  whatsappNotifications: false,
  autoSave: true,
  compactView: false,
  showTutorial: true,
  defaultProject: 'default-project',
  region: 'in',
  currency: 'INR',
  dateFormat: 'DD/MM/YYYY',
  timezone: 'Asia/Kolkata',
};

// Helper to check if database is connected
async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

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
  const isDemo = !(await checkDbConnection());
  
  if (isDemo) {
    return NextResponse.json({
      ...DEMO_SETTINGS,
      isDemoMode: true,
    });
  }
  
  try {
    await ensureDefaultUser();
    const settings = await prisma.userSetting.findMany({
      where: { userId: DEFAULT_USER_ID },
    });
    const result: Record<string, unknown> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return NextResponse.json({
      ...DEMO_SETTINGS,
      ...result,
      isDemoMode: false,
    });
  } catch (error) {
    console.error('[GET /api/settings]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      ...DEMO_SETTINGS,
      isDemoMode: true,
    });
  }
}

export async function POST(req: NextRequest) {
  const isDemo = !(await checkDbConnection());
  
  if (isDemo) {
    // In demo mode, simulate successful save
    const body = await req.json();
    const { action, key, value, settings: bulkSettings } = body;
    
    return NextResponse.json({ 
      success: true, 
      message: 'Setting saved (Demo Mode)',
      isDemoMode: true,
    });
  }
  
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
          create: { userId: DEFAULT_USER_ID, key: k, value: v as Prisma.InputJsonValue },
          update: { value: v as Prisma.InputJsonValue },
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
        value: (value ?? null) as Prisma.InputJsonValue,
      },
      update: { value: (value ?? null) as Prisma.InputJsonValue },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/settings]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
