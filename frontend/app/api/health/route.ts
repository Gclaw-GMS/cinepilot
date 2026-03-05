import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Try to do a simple database query
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({ 
      status: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.log('[Health] Database not connected:', error);
    return NextResponse.json({ 
      status: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
}
