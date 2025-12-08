// pages/api/saved-contacts.js
// GET: returns saved contacts for the authenticated user.
// Requires SUPABASE_* env vars.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function jsonResponse(res, status, body) {
  res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return jsonResponse(res, 405, { error: 'method not allowed' });
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return jsonResponse(res, 501, { error: 'Supabase not configured' });
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

  const authHeader = req.headers.authorization || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const cookie = req.headers.cookie || '';
  const cookies = Object.fromEntries(
    cookie
      .split(';')
      .map(s => s.trim())
      .filter(Boolean)
      .map(c => {
        const i = c.indexOf('=');
        return [c.slice(0, i), c.slice(i + 1)];
      })
  );
  const token = bearer || cookies['session'] || cookies['session_id'] || cookies['sb:token'];

  if (!token) return jsonResponse(res, 401, { error: 'missing session' });

  try {
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return jsonResponse(res, 401, { error: 'invalid session' });
    const user = userData.user;

    const { data } = await supabase
      .from('saved_contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return jsonResponse(res, 200, Array.isArray(data) ? data : []);
  } catch (err) {
    console.error('saved-contacts err', err);
    return jsonResponse(res, 500, { error: 'internal' });
  }
}
