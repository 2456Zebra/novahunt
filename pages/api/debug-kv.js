// Debug-only endpoint to inspect KV keys for a given email.
// Protect with a secret header: x-debug-secret must match process.env.DEBUG_SECRET.
// Usage: POST { email: "user@example.com" } header: x-debug-secret
import { getKV } from './_kv-wrapper';
const kv = getKV();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const secret = req.headers['x-debug-secret'] || '';
  if (!process.env.DEBUG_SECRET) {
    return res.status(403).json({ error: 'Debug endpoint not enabled (no DEBUG_SECRET configured)' });
  }
  if (!secret || secret !== process.env.DEBUG_SECRET) {
    return res.status(401).json({ error: 'Missing or invalid debug secret' });
  }

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email required in body' });

  const emailKey = String(email).toLowerCase();

  try {
    const out = {};
    out['stripe:subscription:' + emailKey] = await kv.get(`stripe:subscription:${emailKey}`);
    out['stripe:checkout:' + emailKey] = await kv.get(`stripe:checkout:${emailKey}`);
    out['user:' + emailKey] = await kv.get(`user:${emailKey}`);
    out['usage:searches:' + emailKey] = await kv.get(`usage:searches:${emailKey}`);
    out['usage:reveals:' + emailKey] = await kv.get(`usage:reveals:${emailKey}`);
    out['local:session:' + emailKey] = await kv.get(`local:session:${emailKey}`);
    return res.status(200).json({ ok: true, kv: out });
  } catch (e) {
    console.error('debug-kv error', e?.message || e);
    return res.status(500).json({ error: 'Server error' });
  }
}
