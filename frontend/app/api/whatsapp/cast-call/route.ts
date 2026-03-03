import { NextRequest, NextResponse } from 'next/server';

// POST /api/whatsapp/cast-call - Send a casting call message
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      recipient, 
      projectName, 
      role, 
      auditionDate, 
      auditionTime, 
      location, 
      contactPhone,
      description 
    } = body;

    if (!recipient || !projectName || !role) {
      return NextResponse.json(
        { error: 'Recipient, projectName, and role are required' },
        { status: 400 }
      );
    }

    // Format casting call message
    let message = `🎭 *Casting Call*\n\n`;
    message += `*Project:* ${projectName}\n`;
    message += `*Role:* ${role}\n`;
    
    if (auditionDate) {
      message += `*Audition Date:* ${auditionDate}\n`;
    }
    
    if (auditionTime) {
      message += `*Time:* ${auditionTime}\n`;
    }
    
    if (location) {
      message += `*Location:* ${location}\n`;
    }
    
    if (contactPhone) {
      message += `*Contact:* ${contactPhone}\n`;
    }
    
    if (description) {
      message += `\n*Description:* ${description}\n`;
    }
    
    message += `\n_Please reply to confirm your interest!_`;

    const messageId = `wa-cast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({
      success: true,
      messageId,
      message,
      status: 'sent',
      timestamp: new Date().toISOString(),
      isDemoMode: true,
    });
  } catch (error) {
    console.error('[POST /api/whatsapp/cast-call]', error);
    return NextResponse.json(
      { error: 'Failed to send casting call' },
      { status: 500 }
    );
  }
}
