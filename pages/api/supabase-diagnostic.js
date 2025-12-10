// pages/api/supabase-diagnostic.js
// Diagnostic: test Supabase service-role connection and checkout_sessions_used table.
// Safe: does not return secrets. Remove after debugging.

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) {
    return res.status(200).json({ ok: false, message: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in env' });
  }

  const supabaseAdmin = createClient(url, key, { auth: { persistSession: false } });

  try {
    // simple select to see if table exists and is queryable
    const { data, error } = await supabaseAdmin.from('checkout_sessions_used').select('id,session_id,email').limit(1);
    if (error) {
      return res.status(200).json({ ok: false, message: 'supabase_query_error', detail: error.message || error });
    }
    return res.status(200).json({ ok: true, message: 'table_query_ok', sample: data || [] });
  } catch (err) {
    return res.status(200).json({ ok: false, message: 'exception', detail: String(err?.message || err) });
  }
}
