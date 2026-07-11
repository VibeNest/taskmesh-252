import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth-middleware';
import { rateLimiter } from '@/lib/rate-limiter';

const publicPaths = ['/', '/login', '/register', '/invitation', '/api/auth'];
const apiPaths = ['/api/'];
const RATE_LIMIT_PATHS: Record<string, string> = {
  '/api/auth': 'auth',
  '/api/workspaces': 'workspace',
  '/api/boards': 'board',
  '/api/tasks': 'task',
};

export default auth(async (req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));
  const isApiPath = apiPaths.some((path) => pathname.startsWith(path));

  if (!isLoggedIn && !isPublicPath) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (isApiPath && pathname !== '/api/health' && pathname !== '/api/metrics') {
    const identifier = req.auth?.user?.id || req.ip || 'anonymous';
    const matching = Object.entries(RATE_LIMIT_PATHS).find(([prefix]) => pathname.startsWith(prefix));
    const key = matching ? matching[1] : 'global';

    const result = await rateLimiter.checkApi(key, identifier);
    if (!result.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'rate_limited', message: 'Too many requests' }),
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
          },
        },
      );
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));
    return response;
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
