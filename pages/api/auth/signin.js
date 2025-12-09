// pages/api/auth/signin.js
// Server-side sign-in endpoint: POST { email, password } -> sets secure HttpOnly cookies.
// Uses COOKIE_DOMAIN env var (e.g. ".novahunt.ai") or derives a root domain from request Host.
// Requires SUPABASE_URL and SUPABASE_ANON_KEY env vars.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const DEFAULT_COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || '';

function sendJson(res, status, body) {
  res.status(status).json(body);
}

function deriveCookieDomainFromHost(hostHeader) {
  if (!hostHeader) return '';
  // Remove port if present
  const host = hostHeader.split(':')[0];
  // If already an apex or has only two labels, prefix with dot
  const parts = host.split('.');
  if (parts.length <= 2) {
    return '.' + host;
  }
  // For multi-label hosts (like preview-domain or sub.sub.domain),
  // use the last two labels as the base (e.g. novahunt.ai)
  const root = parts.slice(-2).join('.');
  return '.' + root;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'method not allowed' });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return sendJson(res, 501, { error: 'Supabase not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.' });
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return sendJson(res, 400, { error: 'missing email or password' });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data || !data.session) {
      console.warn('signin failed', error);
      return sendJson(res, 401, { error: 'invalid_credentials' });
    }

    const session = data.session;
    const accessToken = session.access_token || session.accessToken || null;
    const expiresIn = session.expires_in || 60 * 60 * 24 * 7; // fallback 7 days

    if (!accessToken) {
      return sendJson(res, 500, { error: 'no_access_token' });
    }

    // Decide cookie domain: env var takes precedence, otherwise derive from Host
    let cookieDomain = DEFAULT_COOKIE_DOMAIN && DEFAULT_COOKIE_DOMAIN.trim().length ? DEFAULT_COOKIE_DOMAIN.trim() : '';
    if (!cookieDomain) {
      cookieDomain = deriveCookieDomainFromHost(req.headers.host) || '';
    }

    // Use SameSite=None and Secure to allow cookie after cross-site redirect (Stripe -> your site).
    const maxAge = Number(expiresIn) || 60 * 60 * 24 * 7; // seconds
    const baseCookieOpts = [
      'Path=/',
      cookieDomain ? `Domain=${cookieDomain}` : '',
      'HttpOnly',
      'SameSite=None', // allow cross-site redirects to include cookie
      'Secure',
      `Max-Age=${maxAge}`
    ].filter(Boolean).join('; ');

    const cookies = [
      `session=${accessToken}; ${baseCookieOpts}`,
      `sb:token=${accessToken}; ${baseCookieOpts}`
    ];

    if (session.refresh_token) {
      const refreshOpts = [
        'Path=/',
        cookieDomain ? `Domain=${cookieDomain}` : '',
        'HttpOnly',
        'SameSite=None',
        'Secure',
        `Max-Age=${60 * 60 * 24 * 30}` // 30 days
      ].filter(Boolean).join('; ');
      cookies.push(`refresh_token=${session.refresh_token}; ${refreshOpts}`);
    }

    res.setHeader('Set-Cookie', cookies);
    // Return session info for debugging (client won't be able to read cookies if HttpOnly)
    return sendJson(res, 200, { ok: true, session: { expires_at: session.expires_at || null } });
  } catch (err) {
    console.error('signin endpoint error', err);
    return sendJson(res, 500, { error: 'internal' });
  }
}
