import { NextRequest, NextResponse } from 'next/server';

// This route provides a dedicated endpoint for WhatsApp status
// It mirrors the main WhatsApp status response for convenience

export async function GET(req: NextRequest) {
  // Return the same status as the main route
  return NextResponse.json({
    connected: true,
    provider: 'demo',
    phoneNumber: '+91 98765 43210',
    businessName: 'CinePilot Production',
    isDemoMode: true,
    lastChecked: new Date().toISOString(),
    features: {
      templates: true,
      messageHistory: true,
      scheduledMessages: true,
      bulkSend: true,
    }
  });
}
