import { NextResponse } from 'next/server';

/**
 * Server-side middleware to protect routes and avoid client-side redirect flashes.
 *
 * Behavior:
 * - If the request path is a protected route (e.g. /dashboard, /account, /settings),
 *   and there is no auth cookie, middleware performs a server redirect to /signin.
 * - Skips static and API paths.
 *
 * Adjust `protectedPaths` to match the pages you want server-protected.
 *
 * Note: middleware runs on the Edge runtime. Keep logic small and avoid heavy libs here.
 */
export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Skip next internals, static files, and API endpoints
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // static assets like .css, .png
  ) {
    return NextResponse.next();
  }

  // Define protected paths - adjust as needed
  const protectedPaths = ['/dashboard', '/account', '/settings'];
  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Read auth cookie set by your set-password API ("auth")
  const token = req.cookies.get && req.cookies.get('auth') ? req.cookies.get('auth').value : null;

  if (!token) {
    // Redirect unauthenticated users to signin with redirect back
    const signinUrl = new URL('/signin', req.url);
    signinUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signinUrl);
  }

  // If token exists, allow request to continue. Server-side verification is optional here.
  return NextResponse.next();
}

// Apply middleware to all routes; you can scope via matcher if needed.
// export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] };
