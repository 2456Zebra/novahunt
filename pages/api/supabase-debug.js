// pages/api/supabase-debug.js
// Temporary debug endpoint — do not leave this enabled long-term.
// Usage (browser): https://www.novahunt.ai/api/supabase-debug?debug_secret=YOUR_TEST_API_SECRET&email=test1110@novahunt.ai
//
// It will call Supabase Admin users lookup for the email (or limit=1 if no email) and
// return the raw text, parsed JSON (if any), status code and some headers so we can see
// exactly what Supabase is returning when our other code says "User exists but id not found".
export default async function handler(req, res) {
  const provided = String(req.query.debug_secret || '');
  const SECRET = process.env.TEST_API_SECRET || '';
  if (!SECRET || provided !== SECRET) {
    return res.status(401).json({ ok: false, error: 'missing_or_invalid_debug_secret' });
  }

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    return res.status(500).json({
      ok: false,
      error: 'missing_supabase_env_vars',
      details: {
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    });
  }

  try {
    const email = req.query.email ? String(req.query.email).trim().toLowerCase() : null;
    const url = email ? `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}` : `${supabaseUrl}/auth/v1/admin/users?limit=1`;

    const r = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceRole}`,
        apikey: serviceRole,
      },
    });

    const text = await r.text();
    let parsed = null;
    try { parsed = JSON.parse(text); } catch (e) { parsed = null; }

    // Return everything useful for debugging
    return res.status(200).json({
      ok: r.ok,
      status: r.status,
      url_tested: url,
      raw_text: text,
      parsed_json: parsed,
      headers: {
        'supabase-response-content-type': r.headers.get('content-type') || null
      },
      note: 'This endpoint is temporary — delete after debugging.'
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'fetch_error', detail: String(e.message || e) });
  }
}
