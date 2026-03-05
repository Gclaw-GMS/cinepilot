import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PROJECT_ID = 'default-project';

// In-memory message store for demo mode (resets on server restart)
let sentMessages: Array<{
  id: string
  recipient: string
  recipientName?: string
  message: string
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: string
  useWacli: boolean
  error?: string
}> = []

// Simulate message status progression in demo mode
// Messages progress: pending -> sent -> delivered -> read
function simulateMessageDelivery(message: typeof sentMessages[0]) {
  const now = Date.now();
  const sentTime = new Date(message.timestamp).getTime();
  
  // After 2 seconds: delivered
  setTimeout(() => {
    const idx = sentMessages.findIndex(m => m.id === message.id);
    if (idx !== -1 && sentMessages[idx].status === 'sent') {
      sentMessages[idx].status = 'delivered';
    }
  }, 2000 - (now - sentTime));
  
  // After 5 seconds: read
  setTimeout(() => {
    const idx = sentMessages.findIndex(m => m.id === message.id);
    if (idx !== -1 && sentMessages[idx].status === 'delivered') {
      sentMessages[idx].status = 'read';
    }
  }, 5000 - (now - sentTime));
}

// Demo contacts for autofill
const DEMO_CONTACTS = [
  { name: 'Ajith Kumar', phone: '+919876543210', role: 'Lead Actor' },
  { name: 'Sai Pallavi', phone: '+919876543211', role: 'Lead Actress' },
  { name: 'Vijay Sethupathi', phone: '+919876543212', role: 'Supporting Actor' },
  { name: 'Ravi K. Chandran', phone: '+919876543213', role: 'Cinematographer' },
  { name: 'A.R. Rahman', phone: '+919876543214', role: 'Music Director' },
  { name: 'Mani Ratnam', phone: '+919876543215', role: 'Director' },
  { name: 'Lakshmi', phone: '+919876543216', role: 'Art Director' },
  { name: 'Vetri', phone: '+919876543217', role: 'Editor' },
];

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
    const { recipient, message, recipientName, useWacli } = body;

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

    // Auto-detect recipient name from demo contacts if not provided
    let detectedName = recipientName;
    if (!detectedName) {
      const contact = DEMO_CONTACTS.find(c => c.phone === recipient);
      if (contact) {
        detectedName = contact.name;
      }
    }

    // Simulate sending (in production, this would use WhatsApp Business API)
    const messageId = `wa-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    const sentMessage = {
      id: messageId,
      recipient,
      recipientName: detectedName || null,
      message,
      status: 'sent' as const,
      timestamp,
      useWacli: useWacli ?? true,
    };

    // Store in history
    sentMessages.unshift(sentMessage);
    if (sentMessages.length > 100) {
      sentMessages = sentMessages.slice(0, 100);
    }

    // Simulate delivery progression in demo mode
    simulateMessageDelivery(sentMessage);

    return NextResponse.json({
      success: true,
      messageId,
      status: 'sent',
      timestamp,
      recipientName: detectedName,
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
    // Support filtering by status
    const statusFilter = req.nextUrl.searchParams.get('status');
    let filteredMessages = sentMessages;
    if (statusFilter) {
      filteredMessages = sentMessages.filter(m => m.status === statusFilter);
    }
    
    return NextResponse.json({
      messages: filteredMessages,
      total: sentMessages.length,
      stats: {
        sent: sentMessages.filter(m => m.status === 'sent').length,
        delivered: sentMessages.filter(m => m.status === 'delivered').length,
        read: sentMessages.filter(m => m.status === 'read').length,
        failed: sentMessages.filter(m => m.status === 'failed').length,
      },
      isDemoMode: true,
    });
  }
  
  // Get status of a specific message
  if (action === 'status') {
    const messageId = req.nextUrl.searchParams.get('messageId');
    if (!messageId) {
      return NextResponse.json({ error: 'messageId required' }, { status: 400 });
    }
    const message = sentMessages.find(m => m.id === messageId);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    return NextResponse.json({
      id: message.id,
      status: message.status,
      timestamp: message.timestamp,
      recipientName: message.recipientName,
      isDemoMode: true,
    });
  }
  
  // Get contacts
  if (action === 'contacts') {
    return NextResponse.json({
      contacts: DEMO_CONTACTS,
      isDemoMode: true,
    });
  }
  
  // Get status
  return NextResponse.json({
    connected: true,
    provider: 'demo',
    phoneNumber: '+91 98765 43210',
    businessName: 'CinePilot Production',
    messagesToday: sentMessages.filter(m => {
      const msgDate = new Date(m.timestamp).toDateString();
      const today = new Date().toDateString();
      return msgDate === today;
    }).length,
    isDemoMode: true,
  });
}

// DELETE /api/whatsapp - Delete a message from history
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('messageId');
    const action = searchParams.get('action');

    // Clear all messages
    if (action === 'clear-all') {
      const count = sentMessages.length;
      sentMessages = [];
      return NextResponse.json({
        success: true,
        deleted: count,
        message: 'All messages cleared',
        isDemoMode: true,
      });
    }

    // Delete specific message
    if (!messageId) {
      return NextResponse.json(
        { error: 'messageId is required' },
        { status: 400 }
      );
    }

    const initialLength = sentMessages.length;
    sentMessages = sentMessages.filter(m => m.id !== messageId);
    
    if (sentMessages.length === initialLength) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId,
      deleted: true,
      isDemoMode: true,
    });
  } catch (error) {
    console.error('[DELETE /api/whatsapp]', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
