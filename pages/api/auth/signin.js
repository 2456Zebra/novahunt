// pages/api/auth/signin.js
//
// Server-side sign-in endpoint for Next.js that:
// - Accepts POST { email, password }
// - Uses SUPABASE_ANON_KEY + SUPABASE_URL to sign in via supabase-js
// - On success, sets a secure HttpOnly cookie (session) containing the access_token
// - Returns the signed-in session JSON to the client
//
// Required env vars (set in Vercel / hosting):
// - SUPABASE_URL
// - SUPABASE_ANON_KEY

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

function sendJson(res, status, body) {
  res.status(status).json(body);
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
    const expiresIn = session.expires_in || 60 * 60 * 24 * 7;

    if (!accessToken) {
      return sendJson(res, 500, { error: 'no_access_token' });
    }

    const maxAge = Number(expiresIn) || 60 * 60 * 24 * 7; // seconds
    const cookieOpts = `Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${maxAge}`;
    const cookies = [
      `session=${accessToken}; ${cookieOpts}`,
      `sb:token=${accessToken}; ${cookieOpts}`
    ];

    if (session.refresh_token) {
      cookies.push(`refresh_token=${session.refresh_token}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${60 * 60 * 24 * 30}`);
    }

    res.setHeader('Set-Cookie', cookies);
    return sendJson(res, 200, { ok: true, session });
  } catch (err) {
    console.error('signin endpoint error', err);
    return sendJson(res, 500, { error: 'internal' });
  }
}
