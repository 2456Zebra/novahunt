// pages/api/auth/signin.js
// POST { email, password } -> sign in with Supabase and set secure HttpOnly cookies.
// Uses COOKIE_DOMAIN env var (recommended ".novahunt.ai") or derives domain from Host header.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const DEFAULT_COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || '';

function sendJson(res, status, body) {
  res.status(status).json(body);
}

function deriveCookieDomainFromHost(hostHeader) {
  if (!hostHeader) return '';
  const host = hostHeader.split(':')[0];
  const parts = host.split('.');
  if (parts.length <= 2) {
    return '.' + host;
  }
  const root = parts.slice(-2).join('.');
  return '.' + root;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'method_not_allowed' });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return sendJson(res, 501, { error: 'supabase_not_configured' });
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return sendJson(res, 400, { error: 'missing_email_or_password' });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data || !data.session) {
      console.warn('signin failed', error);
      return sendJson(res, 401, { error: 'invalid_credentials', detail: error?.message || null });
    }

    const session = data.session;
    const accessToken = session.access_token || null;
    const expiresIn = session.expires_in || 60 * 60 * 24 * 7;

    if (!accessToken) {
      return sendJson(res, 500, { error: 'no_access_token' });
    }

    let cookieDomain = DEFAULT_COOKIE_DOMAIN && DEFAULT_COOKIE_DOMAIN.trim().length ? DEFAULT_COOKIE_DOMAIN.trim() : '';
    if (!cookieDomain) {
      cookieDomain = deriveCookieDomainFromHost(req.headers.host) || '';
    }

    const maxAge = Number(expiresIn) || 60 * 60 * 24 * 7;
    const baseCookieOpts = [
      'Path=/',
      cookieDomain ? `Domain=${cookieDomain}` : '',
      'HttpOnly',
      'SameSite=None',
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
        `Max-Age=${60 * 60 * 24 * 30}`
      ].filter(Boolean).join('; ');
      cookies.push(`refresh_token=${session.refresh_token}; ${refreshOpts}`);
    }

    // Set cookies (multiple Set-Cookie headers)
    res.setHeader('Set-Cookie', cookies);
    return sendJson(res, 200, { ok: true, session: { expires_at: session.expires_at || null } });
  } catch (err) {
    console.error('signin endpoint error', err);
    return sendJson(res, 500, { error: 'internal', detail: err?.message || String(err) });
  }
}
