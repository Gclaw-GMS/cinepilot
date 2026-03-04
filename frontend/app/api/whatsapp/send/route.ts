import { NextRequest, NextResponse } from 'next/server';

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

// Demo sent messages storage - persists during server runtime
const sentMessages: Array<{
  id: string;
  recipient: string;
  recipientName?: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  useWacli: boolean;
}> = [];

// Pre-populate with some demo messages
const DEMO_MESSAGES = [
  { 
    id: 'wa-demo-1', 
    recipient: '+919876543210', 
    recipientName: 'Ajith Kumar',
    message: '📅 Schedule Update\n\nDate: 15-03-2026\nTime: 6:00 AM\nLocation: Studio A', 
    status: 'read' as const, 
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    useWacli: true 
  },
  { 
    id: 'wa-demo-2', 
    recipient: '+919876543213', 
    recipientName: 'Ravi K. Chandran',
    message: '⏰ Call Reminder\n\nDon\'t forget: 15-03-2026 at 5:00 AM', 
    status: 'delivered' as const, 
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    useWacli: true 
  },
  { 
    id: 'wa-demo-3', 
    recipient: '+919876543214', 
    recipientName: 'A.R. Rahman',
    message: '🎬 Music Session Update\n\nRecording scheduled for 20th March', 
    status: 'read' as const, 
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    useWacli: true 
  },
];

// Initialize with demo messages
sentMessages.push(...DEMO_MESSAGES);

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

    // Auto-detect recipient name from demo contacts if not provided
    let detectedName = recipientName;
    if (!detectedName) {
      const contact = DEMO_CONTACTS.find(c => c.phone === recipient);
      if (contact) {
        detectedName = contact.name;
      }
    }

    // Simulate sending a message
    const messageId = `wa-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    const sentMessage = {
      id: messageId,
      recipient,
      recipientName: detectedName || undefined,
      message,
      status: 'sent' as const,
      timestamp,
      useWacli: useWacli ?? true,
    };

    // Store in history
    sentMessages.unshift(sentMessage);
    if (sentMessages.length > 100) {
      sentMessages.length = 100;
    }

    // Simulate delivery progression (demo mode)
    setTimeout(() => {
      const idx = sentMessages.findIndex(m => m.id === messageId);
      if (idx !== -1 && sentMessages[idx].status === 'sent') {
        sentMessages[idx].status = 'delivered';
      }
    }, 2000);

    setTimeout(() => {
      const idx = sentMessages.findIndex(m => m.id === messageId);
      if (idx !== -1 && sentMessages[idx].status === 'delivered') {
        sentMessages[idx].status = 'read';
      }
    }, 5000);

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

// GET /api/whatsapp/send - Get send status or history
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get('messageId');
  const action = searchParams.get('action');

  // Get all messages (history)
  if (action === 'history' || action === 'all') {
    return NextResponse.json({
      messages: sentMessages,
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

  // Get specific message status
  if (messageId) {
    const message = sentMessages.find(m => m.id === messageId);
    if (message) {
      return NextResponse.json({ 
        message,
        isDemoMode: true 
      });
    }
    return NextResponse.json(
      { error: 'Message not found' },
      { status: 404 }
    );
  }

  // Return recent messages
  return NextResponse.json({
    messages: sentMessages.slice(0, 20),
    total: sentMessages.length,
    isDemoMode: true,
  });
}
