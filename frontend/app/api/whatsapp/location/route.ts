import { NextRequest, NextResponse } from 'next/server';

// POST /api/whatsapp/location - Send a location update message
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recipient, locationName, address, coordinates, additionalInfo } = body;

    if (!recipient || !locationName) {
      return NextResponse.json(
        { error: 'Recipient and locationName are required' },
        { status: 400 }
      );
    }

    // Format location message
    let message = `📍 *Location Update*\n\n`;
    message += `*Location:* ${locationName}\n`;
    
    if (address) {
      message += `*Address:* ${address}\n`;
    }
    
    if (coordinates) {
      message += `*Coordinates:* ${coordinates.lat}, ${coordinates.lng}\n`;
    }
    
    if (additionalInfo) {
      message += `\n${additionalInfo}\n`;
    }
    
    message += `\n_Share your ETA!_`;

    const messageId = `wa-loc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({
      success: true,
      messageId,
      message,
      status: 'sent',
      timestamp: new Date().toISOString(),
      isDemoMode: true,
    });
  } catch (error) {
    console.error('[POST /api/whatsapp/location]', error);
    return NextResponse.json(
      { error: 'Failed to send location update' },
      { status: 500 }
    );
  }
}
