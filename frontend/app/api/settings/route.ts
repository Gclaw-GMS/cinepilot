import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

const DEFAULT_USER_ID = 'default-user';

// Demo settings for when database is not available
const DEMO_SETTINGS = {
  theme: 'dark',
  language: 'en',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  dateFormat: 'DD-MM-YYYY',
  notifications: {
    email: true,
    push: true,
    sms: false,
  },
  production: {
    defaultQuality: '4K',
    defaultFrameRate: '24fps',
    defaultResolution: '4096x2160',
  },
  api: {
    aiProvider: 'aiml',
    weatherProvider: 'open-meteo',
  },
  display: {
    dashboardLayout: 'grid',
    showStats: true,
    compactMode: false,
  },
};

// In-memory store for demo mode
let demoSettings: Record<string, any> = { ...DEMO_SETTINGS };

// Check database connection
async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    await prisma.$disconnect();
    return true;
  } catch {
    return false;
  }
}

async function ensureDefaultUser(): Promise<void> {
  try {
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
  } catch (error) {
    console.log('[ensureDefaultUser] Database not available');
  }
}

export async function GET() {
  // Check if database is available
  const dbConnected = await checkDbConnection();
  
  if (!dbConnected) {
    // Return demo settings
    return NextResponse.json({
      ...demoSettings,
      isDemoMode: true,
    });
  }

  try {
    await ensureDefaultUser();
    const settings = await prisma.userSetting.findMany({
      where: { userId: DEFAULT_USER_ID },
    });
    
    // Merge demo defaults with stored settings
    const result: Record<string, unknown> = { ...DEMO_SETTINGS };
    for (const s of settings) {
      result[s.key] = s.value;
    }
    
    return NextResponse.json({
      ...result,
      isDemoMode: false,
    });
  } catch (error) {
    console.error('[GET /api/settings]', error);
    // Fallback to demo settings on any error
    return NextResponse.json({
      ...demoSettings,
      isDemoMode: true,
    });
  }
}

export async function POST(req: NextRequest) {
  // Check if database is available
  const dbConnected = await checkDbConnection();
  
  // Handle demo mode
  if (!dbConnected) {
    try {
      const body = await req.json();
      const { action, key, value, settings: bulkSettings } = body;

      if (action === 'bulk') {
        const settingsRecord = bulkSettings as Record<string, unknown> | undefined;
        if (!settingsRecord || typeof settingsRecord !== 'object' || Array.isArray(settingsRecord)) {
          return NextResponse.json({ error: 'settings must be a Record<string, any>' }, { status: 400 });
        }
        demoSettings = { ...demoSettings, ...settingsRecord };
        return NextResponse.json({ success: true, isDemoMode: true });
      }

      if (typeof key !== 'string' || !key.trim()) {
        return NextResponse.json({ error: 'key is required' }, { status: 400 });
      }

      // Handle nested keys like "notifications.email"
      if (key.includes('.')) {
        const keys = key.split('.');
        let current: any = demoSettings;
        for (let i = 0; i < keys.length - 1; i++) {
          if (typeof current[keys[i]] !== 'object') {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
      } else {
        demoSettings[key] = value;
      }

      return NextResponse.json({ success: true, isDemoMode: true });
    } catch (error) {
      console.error('[POST /api/settings] Demo mode error:', error);
      return NextResponse.json({ error: 'Failed to update settings in demo mode' }, { status: 500 });
    }
  }

  // Database mode
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

      return NextResponse.json({ success: true, isDemoMode: false });
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

    return NextResponse.json({ success: true, isDemoMode: false });
  } catch (error) {
    console.error('[POST /api/settings]', error);
    // Fallback to demo mode on error
    try {
      const body = await req.json();
      const { key, value, settings: bulkSettings } = body;
      
      if (bulkSettings && typeof bulkSettings === 'object') {
        demoSettings = { ...demoSettings, ...bulkSettings };
      } else if (key) {
        demoSettings[key] = value;
      }
      
      return NextResponse.json({ success: true, isDemoMode: true, fallback: true });
    } catch {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }
}
