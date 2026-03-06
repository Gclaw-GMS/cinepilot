import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

// Interface definitions
interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  database: {
    status: 'connected' | 'disconnected';
    latencyMs?: number;
    error?: string;
    records?: number;
  };
  services: {
    name: string;
    status: 'up' | 'down';
    latencyMs?: number;
    details?: string;
  }[];
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      loadAverage: number[];
    };
    nodeVersion: string;
    platform: string;
  };
  endpoints: {
    name: string;
    status: 'reachable' | 'unreachable';
    latencyMs?: number;
  }[];
  responseTimeMs: number;
}

// Helper to get memory usage
function getMemoryUsage(): { used: number; total: number; percentage: number } {
  try {
    if (typeof process !== 'undefined' && typeof process.memoryUsage === 'function') {
      const mem = process.memoryUsage();
      const used = Math.round(mem.heapUsed / 1024 / 1024);
      const total = Math.round(mem.heapTotal / 1024 / 1024);
      return {
        used,
        total,
        percentage: total > 0 ? Math.round((used / total) * 100) : 0
      };
    }
  } catch {
    // Ignore errors
  }
  return { used: 0, total: 0, percentage: 0 };
}

// Helper to get CPU load average
function getCpuLoad(): number[] {
  try {
    if (typeof process !== 'undefined' && typeof process.uptime === 'function') {
      return [0, 0, 0]; // Node.js doesn't provide load avg on all platforms
    }
  } catch {
    // Ignore errors
  }
  return [0, 0, 0];
}

// Check database with detailed stats
async function checkDatabase(): Promise<{
  connected: boolean;
  latencyMs?: number;
  error?: string;
  records?: number;
}> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    // Try to get record counts (optional, won't fail if can't)
    let recordCount: number | undefined;
    try {
      const result = await prisma.$queryRaw<any[]>`SELECT COUNT(*) as count FROM "Project"` as any[];
      recordCount = result[0]?.count ? parseInt(result[0].count) : 0;
    } catch {
      // Table might not exist yet
    }

    return {
      connected: true,
      latencyMs: latency,
      records: recordCount
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
}

// Check external service availability
async function checkExternalService(name: string, url: string): Promise<{
  name: string;
  status: 'up' | 'down';
  latencyMs?: number;
  details?: string;
}> {
  try {
    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - start;

    return {
      name,
      status: response.ok ? 'up' : 'down',
      latencyMs: latency,
      details: `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      name,
      status: 'down',
      details: error instanceof Error ? error.message : 'Connection failed'
    };
  }
}

// Main health check endpoint
export async function GET(req: NextRequest) {
  const start = Date.now();
  const url = new URL(req.url);
  const simple = url.searchParams.get('simple') === 'true';

  // For simple ping requests
  if (simple) {
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  }

  // Full health check
  const health: HealthResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime?.() || 0,
    database: {
      status: 'disconnected'
    },
    services: [],
    system: {
      memory: getMemoryUsage(),
      cpu: {
        loadAverage: getCpuLoad()
      },
      nodeVersion: process.version || 'unknown',
      platform: process.platform || 'unknown'
    },
    endpoints: [],
    responseTimeMs: 0
  };

  // Check database
  const dbResult = await checkDatabase();
  health.database = {
    status: dbResult.connected ? 'connected' : 'disconnected',
    latencyMs: dbResult.latencyMs,
    error: dbResult.error,
    records: dbResult.records
  };

  // Add database to services list
  health.services.push({
    name: 'PostgreSQL',
    status: dbResult.connected ? 'up' : 'down',
    latencyMs: dbResult.latencyMs,
    details: dbResult.records !== undefined ? `${dbResult.records} projects` : undefined
  });

  // Check key API endpoints
  const endpointChecks = [
    { name: 'Scripts API', path: '/api/scripts' },
    { name: 'Tasks API', path: '/api/tasks' },
    { name: 'Budget API', path: '/api/budget' },
    { name: 'Weather API', path: '/api/weather' }
  ];

  for (const endpoint of endpointChecks) {
    try {
      const epStart = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      // Use the same base URL as the request
      const baseUrl = `${url.protocol}//${url.host}`;
      await fetch(`${baseUrl}${endpoint.path}`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - epStart;

      health.endpoints.push({
        name: endpoint.name,
        status: 'reachable',
        latencyMs: latency
      });
    } catch {
      health.endpoints.push({
        name: endpoint.name,
        status: 'unreachable'
      });
    }
  }

  // Determine overall status
  const dbUp = health.database.status === 'connected';
  const endpointsReachable = health.endpoints.every(e => e.status === 'reachable');

  if (!dbUp) {
    health.status = 'degraded';
  } else if (!endpointsReachable) {
    health.status = 'degraded';
  }

  // Calculate response time
  health.responseTimeMs = Date.now() - start;

  // Set appropriate status code
  const statusCode = health.status === 'healthy' ? 200 : 200; // Always return 200 for health checks, status is in body

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
      'X-Health-Status': health.status,
      'X-Response-Time': `${health.responseTimeMs}ms`
    }
  });
}

// HEAD request for lightweight health check (load balancer friendly)
export async function HEAD(req: NextRequest) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Health-Status': 'healthy'
      }
    });
  } catch {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'X-Health-Status': 'unhealthy'
      }
    });
  }
}
