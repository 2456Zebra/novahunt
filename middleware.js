import { NextResponse } from 'next/server';

/*
  Canonical host middleware with preview guard.

  - Skips redirect when host is a Vercel preview (host endsWith '.vercel.app' or contains 'githubpreview.dev')
    or when VERCEL_ENV === 'preview' (set by Vercel on preview deployments).
  - Otherwise enforces the canonical hostname (www.novahunt.ai).

  Place this at the project root (feature/company-profile branch), commit, and push.
  This will stop preview deployments from being redirected to production so you can test them.
*/

export function middleware(req) {
  const host = req.headers.get('host') || '';
  const url = req.nextUrl.clone();

  // Allow preview and local development hosts to proceed without redirect
  const isPreviewHost =
    host.endsWith('.vercel.app') ||
    host.includes('.vercel-preview.') || // some previews
    host.includes('githubpreview.dev') ||
    process.env.VERCEL_ENV === 'preview' ||
    host.startsWith('localhost');

  if (isPreviewHost) {
    return NextResponse.next();
  }

  // Enforce canonical host for all other requests
  const canonicalHost = 'www.novahunt.ai';
  if (host === canonicalHost) {
    return NextResponse.next();
  }

  url.hostname = canonicalHost;
  // preserve the protocol + pathname + search
  return NextResponse.redirect(url);
}
