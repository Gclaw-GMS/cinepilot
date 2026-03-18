import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import os from 'os';

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
  systemInfo?: {
    platform: string;
    arch: string;
    nodeVersion: string;
    cpuCores: number;
    totalMemoryGB: number;
    freeMemoryGB: number;
    hostname: string;
  };
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
      checks.push({
        component: 'database',
        status: 'healthy',
        message: 'Connected',
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
  const memStart = Date.now();
  try {
    const used = process.memoryUsage();
    const heapUsedMB = used.heapUsed / (1024 * 1024);
    const heapTotalMB = used.heapTotal / (1024 * 1024);
    const heapPercent = (heapUsedMB / heapTotalMB) * 100;
    
    checks.push({
      component: 'memory',
      status: heapPercent > 90 ? 'unhealthy' : heapPercent > 75 ? 'degraded' : 'healthy',
      message: `${heapUsedMB.toFixed(1)}MB heap used of ${heapTotalMB.toFixed(1)}MB`,
      details: { heapUsedMB: Math.round(heapUsedMB), heapTotalMB: Math.round(heapTotalMB), heapPercent: Math.round(heapPercent) },
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

  // Check CPU usage
  const cpuStart = Date.now();
  try {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });
    
    const cpuUsage = Math.round((1 - totalIdle / totalTick) * 100);
    const cpuModel = cpus[0]?.model || 'Unknown';
    
    checks.push({
      component: 'cpu',
      status: cpuUsage > 90 ? 'unhealthy' : cpuUsage > 75 ? 'degraded' : 'healthy',
      message: `${cpuUsage}% usage (${cpus.length} cores)`,
      details: { 
        cpuUsage, 
        cpuCores: cpus.length, 
        cpuModel: cpuModel.substring(0, 50),
        loadAverage: os.loadavg()
      },
      latencyMs: Date.now() - cpuStart,
    });
  } catch (error) {
    checks.push({
      component: 'cpu',
      status: 'degraded',
      message: 'Could not check CPU',
      latencyMs: Date.now() - cpuStart,
    });
  }

  // Check external API connectivity (Weather API)
  const apiStart = Date.now();
  try {
    const weatherRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=13.08&longitude=80.27&current=temperature_2m', { 
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    if (weatherRes.ok) {
      checks.push({
        component: 'external_api',
        status: 'healthy',
        message: 'Weather API reachable',
        details: { service: 'Open-Meteo', responseTime: Date.now() - apiStart },
        latencyMs: Date.now() - apiStart,
      });
    } else {
      checks.push({
        component: 'external_api',
        status: 'degraded',
        message: `Weather API returned ${weatherRes.status}`,
        details: { service: 'Open-Meteo', status: weatherRes.status },
        latencyMs: Date.now() - apiStart,
      });
    }
  } catch (error) {
    checks.push({
      component: 'external_api',
      status: 'degraded',
      message: 'Weather API unreachable',
      details: { service: 'Open-Meteo', error: error instanceof Error ? error.message : 'Connection failed' },
      latencyMs: Date.now() - apiStart,
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
    systemInfo: {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      cpuCores: os.cpus().length,
      totalMemoryGB: Math.round(os.totalmem() / (1024 * 1024 * 1024) * 100) / 100,
      freeMemoryGB: Math.round(os.freemem() / (1024 * 1024 * 1024) * 100) / 100,
      hostname: os.hostname(),
    },
  };

  return NextResponse.json(response, {
    status: overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503,
  });
}
