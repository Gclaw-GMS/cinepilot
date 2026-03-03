import { NextRequest, NextResponse } from 'next/server';

// Demo scheduled messages storage
const scheduledMessages: any[] = [];

// POST /api/whatsapp/schedule - Schedule a WhatsApp message
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recipient, message, scheduledTime, repeat } = body;

    if (!recipient || !message || !scheduledTime) {
      return NextResponse.json(
        { error: 'Recipient, message, and scheduledTime are required' },
        { status: 400 }
      );
    }

    // Validate scheduled time is in the future
    const scheduleDate = new Date(scheduledTime);
    if (scheduleDate <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      );
    }

    const scheduleId = `sch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const scheduled = {
      id: scheduleId,
      recipient,
      message,
      scheduledTime: scheduleDate.toISOString(),
      repeat: repeat || null,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    };

    scheduledMessages.push(scheduled);

    return NextResponse.json({
      success: true,
      scheduleId,
      scheduled,
      isDemoMode: true,
    });
  } catch (error) {
    console.error('[POST /api/whatsapp/schedule]', error);
    return NextResponse.json(
      { error: 'Failed to schedule message' },
      { status: 500 }
    );
  }
}

// GET /api/whatsapp/schedule - Get scheduled messages
export async function GET() {
  return NextResponse.json({
    scheduled: scheduledMessages,
    isDemoMode: true,
  });
}

// DELETE /api/whatsapp/schedule - Cancel a scheduled message
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const scheduleId = searchParams.get('id');

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    const index = scheduledMessages.findIndex(m => m.id === scheduleId);
    if (index === -1) {
      return NextResponse.json(
        { error: 'Scheduled message not found' },
        { status: 404 }
      );
    }

    scheduledMessages.splice(index, 1);

    return NextResponse.json({
      success: true,
      isDemoMode: true,
    });
  } catch (error) {
    console.error('[DELETE /api/whatsapp/schedule]', error);
    return NextResponse.json(
      { error: 'Failed to cancel scheduled message' },
      { status: 500 }
    );
  }
}
