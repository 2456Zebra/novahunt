// pages/api/session-info.js
// Defensive session-info: validates a token via Supabase auth.getUser and only queries usage/subscription tables.
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

  // Extract token from common places
  const authHeader = req.headers.authorization || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const cookieHeader = req.headers.cookie || '';
  const cookies = Object.fromEntries(
    cookieHeader
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
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return jsonResponse(res, 401, { error: 'invalid session' });
    }
    const user = userData.user;

    // Query subscription & usage — update table names if your schema is different
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
