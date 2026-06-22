import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth-middleware';

const publicPaths = ['/login', '/register', '/api/auth'];
const apiPaths = ['/api/'];
const RATE_LIMIT_PATHS: Record<string, string> = {
  '/api/auth': 'auth',
  '/api/workspaces': 'workspace',
  '/api/boards': 'board',
  '/api/tasks': 'task',
};

export default auth((req: NextRequest & { auth: any }) => {
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
    return NextResponse.redirect(new URL('/workspaces', req.url));
  }

  if (isApiPath && pathname !== '/api/health' && pathname !== '/api/metrics') {
    const identifier = req.auth?.user?.id || 'anonymous';
    const matching = Object.entries(RATE_LIMIT_PATHS).find(([prefix]) => pathname.startsWith(prefix));
    const key = matching ? matching[1] : 'global';

  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
