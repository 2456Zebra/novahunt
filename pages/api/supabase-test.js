// pages/api/supabase-test.js
// Protected test endpoint to verify Supabase admin connectivity from the deployed app.
// Requires header: x-test-secret: <TEST_API_SECRET>
// GET -> lists a single user (limit=1).
// POST { email } -> looks up that email via Supabase admin users endpoint.
//
// Deploy and then call with the TEST_API_SECRET you set in Vercel.
export default async function handler(req, res) {
  const SECRET = process.env.TEST_API_SECRET;
  const provided = req.headers['x-test-secret'];
  if (!SECRET || provided !== SECRET) {
    return res.status(401).json({ ok: false, error: 'missing_or_invalid_test_secret' });
  }

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    return res.status(500).json({
      ok: false,
      error: 'missing_supabase_env_vars',
      details: {
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    });
  }

  try {
    const email = (req.method === 'POST' && req.body && req.body.email) ? String(req.body.email).trim().toLowerCase() : null;
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
    let json = null;
    try { json = JSON.parse(text); } catch (e) { json = text; }

    return res.status(r.ok ? 200 : 500).json({
      ok: r.ok,
      status: r.status,
      url_tested: url,
      response: json,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'fetch_error', detail: String(e.message || e) });
  }
}
