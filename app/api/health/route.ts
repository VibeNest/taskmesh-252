import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import redis from '@/lib/redis';
import { logger } from '@/lib/logger';

export async function GET() {
  const start = Date.now();
  const checks: Record<string, unknown> = {};

  checks.timestamp = new Date().toISOString();
  checks.version = process.env.npm_package_version || '1.0.0';

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'healthy' };
  } catch (err) {
    checks.database = { status: 'unhealthy', error: (err as Error).message };
  }

  try {
    await redis.ping();
    checks.redis = { status: 'healthy' };
  } catch (err) {
    checks.redis = { status: 'unhealthy', error: (err as Error).message };
  }

  const dbStatus = (checks.database as Record<string, string>)?.status;
  const redisStatus = (checks.redis as Record<string, string>)?.status;
  const isHealthy = dbStatus === 'healthy' && redisStatus === 'healthy';
  const statusCode = isHealthy ? 200 : 503;

  const elapsed = Date.now() - start;
  logger.info({ elapsed, healthy: isHealthy }, 'Health check');

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'unhealthy',
      checks: Object.fromEntries(
        Object.entries(checks).map(([k, v]) => [k, v])
      ),
      uptime: process.uptime(),
    },
    { status: statusCode }
  );
}
