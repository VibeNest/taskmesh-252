import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const body = await req.json();
    const { action, identifier } = body;

    if (!action || !identifier) {
      return NextResponse.json({ error: 'Missing action or identifier' }, { status: 400 });
    }

    const key = `api:${action}`;
    const result = await rateLimiter.checkApi(action, identifier);

    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Limit': String(result.totalLimit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.resetAt),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Rate limit check failed' }, { status: 500 });
  }
}
