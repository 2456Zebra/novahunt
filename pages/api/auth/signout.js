// pages/api/auth/signout.js
// Attempt to sign out the user server-side by revoking session token in Supabase and clearing cookies.
// Accepts POST. Requires SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method not allowed' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    // Still clear client cookie(s) for best-effort fallback
    res.setHeader('Set-Cookie', [
      `session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
      `session_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
      `sb:token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
    ]);
    return res.status(200).json({ ok: true, info: 'supabase not configured, client cleared' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

  const cookie = req.headers.cookie || '';
  const cookies = Object.fromEntries(cookie.split(';').map(s => s.trim()).filter(Boolean).map(c => {
    const i = c.indexOf('=');
    return [c.slice(0,i), c.slice(i+1)];
  }));
  const token = cookies['session'] || cookies['session_id'] || cookies['sb:token'] || null;

  try {
    if (token) {
      // Supabase does not have a simple server-side signOut with service role for a session,
      // but we can revoke refresh tokens if stored. This sample tries to delete sessions row.
      await supabase.from('auth.sessions').delete().eq('refresh_token', token).catch(()=>null);
      await supabase.from('auth.sessions').delete().eq('access_token', token).catch(()=>null);
    }
  } catch (e) {
    console.warn('signout supabase cleanup error', e);
  }

  // Clear cookies
  res.setHeader('Set-Cookie', [
    `session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax; Secure`,
    `session_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax; Secure`,
    `sb:token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax; Secure`
  ]);

  return res.status(200).json({ ok: true });
}
