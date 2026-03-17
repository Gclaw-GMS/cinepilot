import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';

interface HealthCheck {
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  details?: Record<string, unknown>;
  latencyMs?: number;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: HealthCheck[];
  version: string;
  isDemo?: boolean;
}

// Check if we're in demo mode (no database configured)
const isDemoMode = !process.env.DATABASE_URL;

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const checks: HealthCheck[] = [];
  const startTime = Date.now();
  
  // Check database connection (only if configured)
  const dbStart = Date.now();
  if (isDemoMode) {
    // Demo mode - simulate database as healthy for UI purposes
    checks.push({
      component: 'database',
      status: 'healthy',
      message: 'Demo mode (no database configured)',
      details: { demoMode: true },
      latencyMs: Date.now() - dbStart,
    });
  } else {
    // Try to connect to actual database
    try {
      const { prisma } = await import('@/lib/db');
      await prisma.$queryRaw`SELECT 1`;
      // Extract database type from connection string
      const dbUrl = process.env.DATABASE_URL || '';
      let dbType = 'PostgreSQL';
      let dbName = 'database';
      
      if (dbUrl.includes('postgres')) {
        dbType = 'PostgreSQL';
        // Extract database name from connection string (between / and ? or end)
        const match = dbUrl.match(/\/([^/?]+)/);
        if (match) dbName = match[1].split(':')[0]; // Remove any password suffix
      } else if (dbUrl.includes('mysql')) {
        dbType = 'MySQL';
        const match = dbUrl.match(/\/([^/?]+)/);
        if (match) dbName = match[1].split(':')[0];
      } else if (dbUrl.includes('sqlite')) {
        dbType = 'SQLite';
        const match = dbUrl.match(/\/([^/?]+)/);
        if (match) dbName = match[1];
      }
      
      checks.push({
        component: 'database',
        status: 'healthy',
        message: `Connected to ${dbType}`,
        details: { 
          dbType, 
          dbName,
          connected: true 
        },
        latencyMs: Date.now() - dbStart,
      });
    } catch (error) {
      checks.push({
        component: 'database',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Connection failed',
        latencyMs: Date.now() - dbStart,
      });
    }
  }

  // Check disk space (workspace)
  const diskStart = Date.now();
  try {
    const workspacePath = process.cwd();
    const stats = await fs.statfs(workspacePath);
    const totalGB = stats.bsize * stats.blocks / (1024 * 1024 * 1024);
    const freeGB = stats.bsize * stats.bfree / (1024 * 1024 * 1024);
    const usedPercent = ((stats.blocks - stats.bfree) / stats.blocks) * 100;
    
    checks.push({
      component: 'disk',
      status: usedPercent > 90 ? 'unhealthy' : usedPercent > 75 ? 'degraded' : 'healthy',
      message: `${freeGB.toFixed(1)}GB free of ${totalGB.toFixed(1)}GB`,
      details: { totalGB, freeGB, usedPercent: Math.round(usedPercent) },
      latencyMs: Date.now() - diskStart,
    });
  } catch (error) {
    checks.push({
      component: 'disk',
      status: 'degraded',
      message: 'Could not check disk space',
      latencyMs: Date.now() - diskStart,
    });
  }

  // Check memory (Node process)
  // Use RSS (Resident Set Size) for more accurate memory monitoring in development
  const memStart = Date.now();
  try {
    const used = process.memoryUsage();
    const heapUsedMB = used.heapUsed / (1024 * 1024);
    const heapTotalMB = used.heapTotal / (1024 * 1024);
    const heapPercent = (heapUsedMB / heapTotalMB) * 100;
    
    // Use RSS for actual memory usage - more accurate for Node.js
    const rssMB = used.rss / (1024 * 1024);
    const rssPercent = (rssMB / (2048)) * 100; // Assume 2GB available
    
    // Use the higher of heap or RSS for status determination
    const memoryPercent = Math.max(heapPercent, rssPercent);
    
    // Thresholds optimized for development environment
    // Production servers typically have more headroom
    // Development mode allows higher memory usage due to hot reloading, etc.
    const isDevelopment = process.env.NODE_ENV === 'development';
    const unhealthyThreshold = isDevelopment ? 95 : 85;
    const degradedThreshold = isDevelopment ? 80 : 65;
    
    checks.push({
      component: 'memory',
      status: memoryPercent > unhealthyThreshold ? 'unhealthy' : memoryPercent > degradedThreshold ? 'degraded' : 'healthy',
      message: `${heapUsedMB.toFixed(1)}MB heap used of ${heapTotalMB.toFixed(1)}MB (RSS: ${rssMB.toFixed(1)}MB)`,
      details: { 
        heapUsedMB: Math.round(heapUsedMB), 
        heapTotalMB: Math.round(heapTotalMB), 
        heapPercent: Math.round(heapPercent),
        rssMB: Math.round(rssMB),
        rssPercent: Math.round(rssPercent),
        environment: isDevelopment ? 'development' : 'production'
      },
      latencyMs: Date.now() - memStart,
    });
  } catch (error) {
    checks.push({
      component: 'memory',
      status: 'degraded',
      message: 'Could not check memory',
      latencyMs: Date.now() - memStart,
    });
  }

  // Check environment variables
  const envStart = Date.now();
  try {
    const requiredVars = ['DATABASE_URL'];
    const missing = requiredVars.filter(v => !process.env[v]);
    
    checks.push({
      component: 'environment',
      status: missing.length > 0 ? 'degraded' : 'healthy',
      message: missing.length > 0 ? `Missing: ${missing.join(', ')}` : 'All required variables set',
      details: { missingVars: missing },
      latencyMs: Date.now() - envStart,
    });
  } catch (error) {
    checks.push({
      component: 'environment',
      status: 'degraded',
      message: 'Could not check environment',
      latencyMs: Date.now() - envStart,
    });
  }

  // Determine overall status
  const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
  const degradedCount = checks.filter(c => c.status === 'degraded').length;
  
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  if (unhealthyCount > 0) {
    overallStatus = 'unhealthy';
  } else if (degradedCount > 0) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'healthy';
  }

  const response: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    isDemo: isDemoMode,
  };

  return NextResponse.json(response, {
    status: overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503,
  });
}
