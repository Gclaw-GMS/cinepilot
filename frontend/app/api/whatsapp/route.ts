import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// In-memory storage for demo mode
let messagesStore = [
  { id: 'wa-1', recipient: '+919876543210', recipientName: 'Ajith Kumar', message: '📅 Schedule Update\n\nDate: 15-03-2026\nTime: 6:00 AM\nLocation: Studio A', status: 'delivered', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'wa-2', recipient: '+919876543213', recipientName: 'Ravi K. Chandran', message: '⏰ Call Reminder\n\nDon\'t forget: 15-03-2026 at 5:00 AM', status: 'read', timestamp: new Date(Date.now() - 7200000).toISOString() },
  { id: 'wa-3', recipient: '+919876543211', recipientName: 'Sai Pallavi', message: '🎬 Call Sheet\n\nScene: 24\nDate: 16-03-2026\nCall Time: 5:00 AM\nLocation: Beach Road', status: 'delivered', timestamp: new Date(Date.now() - 86400000).toISOString() },
];

let isDemoMode = true;

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

export async function GET() {
  const dbConnected = await checkDbConnection();
  isDemoMode = !dbConnected;

  return NextResponse.json({ 
    messages: messagesStore,
    isDemoMode 
  });
}
