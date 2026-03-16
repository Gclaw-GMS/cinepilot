import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
  system?: {
    platform: string;
    nodeVersion: string;
    cpuCores: number;
    totalMemoryGB?: number;
  };
}

// Check if we're in demo mode (no database configured)
const isDemoMode = !process.env.DATABASE_URL;

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const checks: HealthCheck[] = [];
  const startTime = Date.now();
  
  // System info (always available)
  const systemInfo = {
    platform: process.platform,
    nodeVersion: process.version,
    cpuCores: require('os').cpus().length,
    totalMemoryGB: Math.round(require('os').totalmem() / (1024 * 1024 * 1024) * 100) / 100,
  };
  
  // Check database connection (only if configured)
  const dbStart = Date.now();
  if (isDemoMode) {
    checks.push({
      component: 'database',
      status: 'healthy',
      message: 'Demo mode (no database configured)',
      details: { demoMode: true },
      latencyMs: Date.now() - dbStart,
    });
  } else {
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
      details: { totalGB: Math.round(totalGB * 100) / 100, freeGB: Math.round(freeGB * 100) / 100, usedPercent: Math.round(usedPercent) },
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
    const rssMB = used.rss / (1024 * 1024);
    const externalMB = used.external / (1024 * 1024);
    
    // Get system memory info
    const os = require('os');
    const totalSystemMem = os.totalmem();
    const freeSystemMem = os.freemem();
    const systemMemPercent = ((totalSystemMem - freeSystemMem) / totalSystemMem) * 100;
    
    checks.push({
      component: 'memory',
      status: heapPercent > 90 ? 'unhealthy' : heapPercent > 75 ? 'degraded' : 'healthy',
      message: `${heapUsedMB.toFixed(1)}MB heap used of ${heapTotalMB.toFixed(1)}MB`,
      details: { 
        heapUsedMB: Math.round(heapUsedMB), 
        heapTotalMB: Math.round(heapTotalMB), 
        heapPercent: Math.round(heapPercent),
        rssMB: Math.round(rssMB),
        externalMB: Math.round(externalMB),
        systemMemory: {
          totalGB: Math.round(totalSystemMem / (1024 * 1024 * 1024) * 100) / 100,
          freeGB: Math.round(freeSystemMem / (1024 * 1024 * 1024) * 100) / 100,
          usedPercent: Math.round(systemMemPercent),
        }
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

  // Check CPU usage
  const cpuStart = Date.now();
  try {
    const os = require('os');
    const cpuLoad = os.loadavg();
    const cpuCount = os.cpus().length;
    
    // Calculate average load over 1 min per core
    const avgLoadPerCore = cpuLoad[0] / cpuCount;
    const loadPercent = avgLoadPerCore * 100;
    
    checks.push({
      component: 'cpu',
      status: loadPercent > 90 ? 'unhealthy' : loadPercent > 70 ? 'degraded' : 'healthy',
      message: `Load: ${cpuLoad[0].toFixed(2)} (1m), ${cpuLoad[1].toFixed(2)} (5m), ${cpuLoad[2].toFixed(2)} (15m)`,
      details: {
        load1m: Math.round(cpuLoad[0] * 100) / 100,
        load5m: Math.round(cpuLoad[1] * 100) / 100,
        load15m: Math.round(cpuLoad[2] * 100) / 100,
        cores: cpuCount,
        avgLoadPerCore: Math.round(avgLoadPerCore * 100) / 100,
        loadPercent: Math.round(loadPercent),
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

  // Check event loop lag (simulated)
  const eventLoopStart = Date.now();
  try {
    // Simple event loop check - if this takes too long, event loop is blocked
    const start = Date.now();
    await new Promise(resolve => setImmediate(resolve));
    const lag = Date.now() - start;
    
    checks.push({
      component: 'eventloop',
      status: lag > 100 ? 'unhealthy' : lag > 50 ? 'degraded' : 'healthy',
      message: lag < 10 ? 'Event loop responsive' : `${lag}ms lag detected`,
      details: { lagMs: lag },
      latencyMs: Date.now() - eventLoopStart,
    });
  } catch (error) {
    checks.push({
      component: 'eventloop',
      status: 'degraded',
      message: 'Could not check event loop',
      latencyMs: Date.now() - eventLoopStart,
    });
  }

  // Check environment variables
  const envStart = Date.now();
  try {
    const requiredVars = ['DATABASE_URL'];
    const optionalVars = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'WHATSAPP_TOKEN'];
    const missing = requiredVars.filter(v => !process.env[v]);
    const missingOptional = optionalVars.filter(v => !process.env[v]);
    
    checks.push({
      component: 'environment',
      status: missing.length > 0 ? 'degraded' : 'healthy',
      message: missing.length > 0 ? `Missing required: ${missing.join(', ')}` : 'All required variables set',
      details: { 
        missingRequired: missing,
        missingOptional: missingOptional,
        hasOpenAI: !!process.env.OPENAI_API_KEY,
        hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
        hasWhatsApp: !!process.env.WHATSAPP_TOKEN,
      },
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

  // Check external APIs connectivity
  const apiStart = Date.now();
  try {
    const apiChecks = [];
    let unhealthyApis = 0;
    
    // Check OpenAI API (if configured)
    if (process.env.OPENAI_API_KEY) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
          signal: controller.signal,
        });
        
        clearTimeout(timeout);
        
        if (response.ok) {
          apiChecks.push({ name: 'openai', status: 'healthy', latency: 0 });
        } else {
          apiChecks.push({ name: 'openai', status: 'degraded', latency: 0 });
          unhealthyApis++;
        }
      } catch {
        apiChecks.push({ name: 'openai', status: 'unhealthy', latency: 0 });
        unhealthyApis++;
      }
    }
    
    checks.push({
      component: 'external_apis',
      status: unhealthyApis > 0 ? 'degraded' : 'healthy',
      message: apiChecks.length > 0 
        ? `Checked ${apiChecks.length} API(s): ${apiChecks.map(a => `${a.name}:${a.status}`).join(', ')}`
        : 'No external APIs configured',
      details: { apis: apiChecks },
      latencyMs: Date.now() - apiStart,
    });
  } catch (error) {
    checks.push({
      component: 'external_apis',
      status: 'degraded',
      message: 'Could not check external APIs',
      latencyMs: Date.now() - apiStart,
    });
  }

  // Check process info
  const procStart = Date.now();
  try {
    checks.push({
      component: 'process',
      status: 'healthy',
      message: `PID: ${process.pid}, ppid: ${process.ppid}`,
      details: {
        pid: process.pid,
        ppid: process.ppid,
        title: process.title,
        arch: process.arch,
      },
      latencyMs: Date.now() - procStart,
    });
  } catch (error) {
    checks.push({
      component: 'process',
      status: 'degraded',
      message: 'Could not get process info',
      latencyMs: Date.now() - procStart,
    });
  }

  // Check file descriptors (Unix only)
  const fdStart = Date.now();
  if (process.platform !== 'win32') {
    try {
      const { stdout } = await execAsync('lsof -p ' + process.pid + ' 2>/dev/null | wc -l');
      const fdCount = parseInt(stdout.trim(), 10) || 0;
      
      checks.push({
        component: 'file_descriptors',
        status: fdCount > 1000 ? 'unhealthy' : fdCount > 500 ? 'degraded' : 'healthy',
        message: `${fdCount} file descriptors open`,
        details: { count: fdCount },
        latencyMs: Date.now() - fdStart,
      });
    } catch {
      checks.push({
        component: 'file_descriptors',
        status: 'degraded',
        message: 'Could not check file descriptors',
        latencyMs: Date.now() - fdStart,
      });
    }
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
    system: systemInfo,
  };

  return NextResponse.json(response, {
    status: overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503,
  });
}
