import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// Demo templates for WhatsApp messages
const DEMO_TEMPLATES = [
  {
    id: 'tpl-1',
    name: 'Schedule Update',
    category: 'schedule',
    content: '📅 *Shooting Schedule Update*\n\nHi {name}!\n\n*Date:* {date}\n*Time:* {time}\n*Location:* {location}\n\nPlease confirm your availability.',
    variables: ['name', 'date', 'time', 'location'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl-2',
    name: 'Call Reminder',
    category: 'reminder',
    content: '⏰ *Call Reminder*\n\nHi {name}!\n\nDon\'t forget: {date} at {time}\nLocation: {location}\n\nSee you there!',
    variables: ['name', 'date', 'time', 'location'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl-3',
    name: 'Call Sheet',
    category: 'call_sheet',
    content: '🎬 *Call Sheet*\n\n*Scene:* {scene}\n*Date:* {date}\n*Call Time:* {time}\n*Location:* {location}\n\nReport to: {report_to}',
    variables: ['scene', 'date', 'time', 'location', 'report_to'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl-4',
    name: 'Location Change',
    category: 'update',
    content: '📍 *Location Change*\n\nHi {name}!\n\nToday\'s shooting location has changed:\n\n*New Location:* {location}\n*Address:* {address}\n\nPlease update your travel plans.',
    variables: ['name', 'location', 'address'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl-5',
    name: 'Casting Call',
    category: 'casting',
    content: '🎭 *Casting Call*\n\n*Project:* {project}\n*Role:* {role}\n*Date:* {date}\n*Location:* {location}\n\nAudition required. Reply to confirm.',
    variables: ['project', 'role', 'date', 'location'],
    createdAt: new Date().toISOString(),
  },
];

// Demo sent messages history
let sentMessages: any[] = [];

// Helper to check if we're in demo mode
async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

// POST /api/whatsapp/send - Send a WhatsApp message
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recipient, message, useWacli } = body;

    if (!recipient || !message) {
      return NextResponse.json(
        { error: 'Recipient and message are required' },
        { status: 400 }
      );
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const cleanPhone = recipient.replace(/[\s\-\(\)]/g, '');
    if (!phoneRegex.test(cleanPhone) && !cleanPhone.startsWith('91')) {
      // Allow for demo numbers
      if (!cleanPhone.startsWith('demo')) {
        console.log('[WhatsApp] Using demo mode for:', recipient);
      }
    }

    // Simulate sending (in production, this would use WhatsApp Business API)
    const messageId = `wa-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const sentMessage = {
      id: messageId,
      recipient,
      message,
      status: 'sent',
      timestamp: new Date().toISOString(),
      useWacli: useWacli ?? true,
    };

    // Store in history
    sentMessages.unshift(sentMessage);
    if (sentMessages.length > 100) {
      sentMessages = sentMessages.slice(0, 100);
    }

    return NextResponse.json({
      success: true,
      messageId,
      status: 'sent',
      timestamp: sentMessage.timestamp,
      isDemoMode: true,
    });
  } catch (error) {
    console.error('[POST /api/whatsapp/send]', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// GET /api/whatsapp - Get WhatsApp settings and status
export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  
  // Get templates
  if (action === 'templates' || req.nextUrl.pathname.endsWith('/templates')) {
    return NextResponse.json({
      templates: DEMO_TEMPLATES,
      isDemoMode: true,
    });
  }
  
  // Get message history
  if (action === 'history') {
    return NextResponse.json({
      messages: sentMessages,
      isDemoMode: true,
    });
  }
  
  // Get status
  return NextResponse.json({
    connected: true,
    provider: 'demo',
    phoneNumber: '+91 98765 43210',
    businessName: 'CinePilot Production',
    isDemoMode: true,
  });
}
