import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Enhanced health check with database stats, memory usage, and uptime
export async function GET(req: NextRequest) {
  const start = Date.now();
  const health: {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    version: string;
    database: {
      status: 'connected' | 'disconnected';
      latencyMs?: number;
      error?: string;
    };
    services: {
      name: string;
      status: 'up' | 'down';
      latencyMs?: number;
    }[];
    system: {
      uptime: number;
      memory?: { used: number; total: number; percentage: number };
    };
    responseTimeMs: number;
  } = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    database: {
      status: 'disconnected',
    },
    services: [],
    system: {
      uptime: process.uptime?.() || 0,
    },
    responseTimeMs: 0,
  };

  let dbConnected = false;
  let dbError: string | undefined;

  // Check database connection
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;
    
    dbConnected = true;
    health.database = {
      status: 'connected',
      latencyMs: dbLatency,
    };
  } catch (error) {
    dbError = error instanceof Error ? error.message : 'Database connection failed';
    health.database = {
      status: 'disconnected',
      error: dbError,
    };
    health.status = dbConnected ? 'healthy' : 'degraded';
  }

  // Add database service to services list
  health.services.push({
    name: 'PostgreSQL',
    status: dbConnected ? 'up' : 'down',
    latencyMs: health.database.latencyMs,
  });

  // Calculate overall response time
  health.responseTimeMs = Date.now() - start;

  // Determine final status based on services
  const allServicesUp = health.services.every(s => s.status === 'up');
  const anyServiceDown = health.services.some(s => s.status === 'down');
  
  if (anyServiceDown) {
    health.status = 'unhealthy';
  } else if (!allServicesUp) {
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
      'X-Health-Status': health.status,
    },
  });
}
