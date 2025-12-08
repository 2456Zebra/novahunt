// pages/api/session-info.js
// Returns server-side usage & plan info for the current authenticated session.
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function jsonResponse(res, status, body) {
  res.status(status).json(body);
}

export default async function handler(req, res) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return jsonResponse(res, 501, { error: 'Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

  // Try to find a session token:
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
  const sessionIdFromBody = req.method === 'POST' && req.body && req.body.session_id ? req.body.session_id : null;

  const token = bearer || cookies['session'] || cookies['session_id'] || cookies['sb:token'] || sessionIdFromBody;

  if (!token) {
    return jsonResponse(res, 400, { error: 'missing session_id' });
  }

  try {
    // Verify session/token with Supabase admin
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    let user = null;

    if (userErr || !userData?.user) {
      // fallback: lookup auth.sessions by access_token
      const { data: sessions, error: sErr } = await supabase
        .from('auth.sessions')
        .select('*')
        .eq('access_token', token)
        .limit(1);

      if (sErr || !sessions || sessions.length === 0) {
        return jsonResponse(res, 401, { error: 'invalid session' });
      }
      const session = sessions[0];
      const { data: u2 } = await supabase.from('users').select('*').eq('id', session.user_id).limit(1);
      if (!u2 || u2.length === 0) return jsonResponse(res, 401, { error: 'user not found' });
      user = u2[0];
    } else {
      user = userData.user;
    }

    // Query subscription & usage for this user
    const [{ data: subsRes }, { data: usageRes }] = await Promise.all([
      supabase.from('subscriptions').select('*').eq('user_id', user.id).limit(1).maybeSingle().catch(()=>({ data: null })),
      supabase.from('usage').select('*').eq('user_id', user.id).limit(1).maybeSingle().catch(()=>({ data: null })),
    ]);

    const plan = subsRes?.plan ?? subsRes?.tier ?? null;
    const searchesUsed = usageRes?.searches ?? 0;
    const revealsUsed = usageRes?.reveals ?? 0;
    const limitSearches = subsRes?.limit_searches ?? subsRes?.maxSearches ?? 0;
    const limitReveals = subsRes?.limit_reveals ?? subsRes?.maxReveals ?? 0;

    const result = {
      searches: Number(searchesUsed || 0),
      reveals: Number(revealsUsed || 0),
      limitSearches: Number(limitSearches || 0),
      limitReveals: Number(limitReveals || 0),
      plan: plan || null
    };

    return jsonResponse(res, 200, result);
  } catch (err) {
    console.error('session-info err', err);
    return jsonResponse(res, 500, { error: 'internal' });
  }
}
