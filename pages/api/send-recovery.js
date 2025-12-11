// pages/api/send-recovery.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Missing email' });

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return res.status(500).json({ error: 'Supabase env vars not configured' });
  }

  try {
    const r = await fetch(`${supabaseUrl}/auth/v1/recover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ email }),
    });

    const text = await r.text();
    if (!r.ok) {
      return res.status(r.status).json({ error: text || 'Failed to send recovery' });
    }

    return res.status(200).json({ ok: true, message: 'Recovery email sent' });
  } catch (err) {
    console.error('send-recovery error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
