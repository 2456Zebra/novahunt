// pages/api/save-contact.js
// POST: saves a revealed contact for the authenticated user.
// Body: { domain, email, first_name?, last_name?, source? }
// Requires SUPABASE_* env vars.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function jsonResponse(res, status, body) {
  res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return jsonResponse(res, 405, { error: 'method not allowed' });
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

  const payload = req.body || {};
  const { domain, email, first_name, last_name, source } = payload;
  if (!email) return jsonResponse(res, 400, { error: 'missing email' });

  try {
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return jsonResponse(res, 401, { error: 'invalid session' });
    const user = userData.user;

    const insert = {
      user_id: user.id,
      domain: domain || null,
      email,
      first_name: first_name || null,
      last_name: last_name || null,
      source: source || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('saved_contacts').insert([insert]).select().limit(1);
    if (error) {
      console.error('save-contact insert err', error);
      return jsonResponse(res, 500, { error: 'insert failed' });
    }

    return jsonResponse(res, 201, data && data[0] ? data[0] : insert);
  } catch (err) {
    console.error('save-contact err', err);
    return jsonResponse(res, 500, { error: 'internal' });
  }
}
