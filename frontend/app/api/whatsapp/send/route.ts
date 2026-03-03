import { NextRequest, NextResponse } from 'next/server';

// Demo sent messages storage
const sentMessages: any[] = [];

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

    // Simulate sending a message
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
      sentMessages.slice(0, 100);
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

// GET /api/whatsapp/send - Get send status or history
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get('messageId');

  if (messageId) {
    const message = sentMessages.find(m => m.id === messageId);
    if (message) {
      return NextResponse.json({ message, isDemoMode: true });
    }
    return NextResponse.json(
      { error: 'Message not found' },
      { status: 404 }
    );
  }

  // Return recent messages
  return NextResponse.json({
    messages: sentMessages.slice(0, 20),
    isDemoMode: true,
  });
}
