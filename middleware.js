import { NextResponse } from 'next/server';

/**
 * Temporary defensive middleware to prevent server-side redirects away from
 * the set-password / password-success flow while we debug persistence.
 *
 * IMPORTANT: This is a small, temporary safety net. It intentionally allows
 * requests for set-password and password-success to continue without redirect.
 * After you've validated the flow, replace with your normal auth middleware
 * that enforces server-side auth (or implement server-side session persistence).
 */

export function middleware(req) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname || '';

  // Allow static files, _next, api routes, and public assets through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname.match(/\.(svg|png|jpg|jpeg|css|js|map|ico)$/)
  ) {
    return NextResponse.next();
  }

  // Paths we definitely must NOT redirect away from while debugging
  const safePaths = [
    '/set-password',
    '/password-success',
    '/signin',
    '/sign-in',
    '/dashboard', // allow dashboard client-side (we make it client-only elsewhere)
  ];

  for (const p of safePaths) {
    if (pathname === p || pathname.startsWith(p + '/') ) {
      return NextResponse.next();
    }
  }

  // If you previously had middleware that redirected unauthenticated users
  // to /signin, do NOT perform that redirect here. Just continue the request.
  // This ensures the browser stays on the password-success page and the client
  // can finish persisting the Supabase session.
  return NextResponse.next();
}

// Apply middleware to all routes (adjust matcher as needed)
export const config = {
  matcher: '/:path*'
};
