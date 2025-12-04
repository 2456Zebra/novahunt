export default async function handler(req, res) {
  // Temporary unauthenticated debug endpoint — enable only briefly.
  // Usage: /api/supabase-raw-debug?email=someone@example.com
  // Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL set in Vercel.
  try {
    const email = (req.query.email || '').toString().trim().toLowerCase();
    if (!email) return res.status(400).json({ ok: false, error: 'missing_email_query' });

    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRole) {
      return res.status(500).json({ ok: false, error: 'missing_supabase_env_vars', hasNextPublicSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL, hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY });
    }

    const listUrl = `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`;
    const listResp = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceRole}`,
        apikey: serviceRole,
      },
    });

    const text = await listResp.text();
    // Try to parse JSON, otherwise return raw text
    try {
      const json = JSON.parse(text);
      return res.status(listResp.status).json({ ok: listResp.ok, status: listResp.status, raw: json });
    } catch (e) {
      return res.status(listResp.status).json({ ok: listResp.ok, status: listResp.status, rawText: text });
    }
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'internal_error', detail: String(err?.message || err) });
  }
}
