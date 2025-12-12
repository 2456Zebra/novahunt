import { NextResponse } from 'next/server';

export function middleware(req) {
  const accessToken = req.cookies.get('sb-access-token')?.value;
  const refreshToken = req.cookies.get('sb-refresh-token')?.value;

  const url = req.nextUrl;

  // If user has tokens and is trying to go to signin → redirect to dashboard
  if (accessToken && refreshToken && url.pathname.startsWith('/signin')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If user has NO tokens and tries to access dashboard → redirect to signin
  if (!accessToken && url.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/signin', req.url));
  }

  // Otherwise, allow the request
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/signin'],
};
