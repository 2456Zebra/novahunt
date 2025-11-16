// Temporary admin endpoint to inspect user KV and stripe:subscription for an email.
// Protected by DEBUG_SECRET environment variable. Remove this file after debugging.
import { getKV } from './_kv-wrapper';
const kv = getKV();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  if (!process.env.DEBUG_SECRET) {
    return res.status(403).json({ ok: false, error: 'Debug endpoint not enabled (no DEBUG_SECRET configured)' });
  }
  const secret = req.headers['x-debug-secret'] || '';
  if (!secret || secret !== process.env.DEBUG_SECRET) {
    return res.status(401).json({ ok: false, error: 'Missing or invalid debug secret' });
  }

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ ok: false, error: 'email required in body' });
  const key = String(email).toLowerCase();

  try {
    const userKey = `user:${key}`;
    const subKey = `stripe:subscription:${key}`;
    const usageSearchKey = `usage:searches:${key}`;
    const usageRevealKey = `usage:reveals:${key}`;

    const user = kv ? await kv.get(userKey) : null;
    const subscription = kv ? await kv.get(subKey) : null;
    const searches = kv ? await kv.get(usageSearchKey) : null;
    const reveals = kv ? await kv.get(usageRevealKey) : null;

    return res.status(200).json({
      ok: true,
      keys: {
        userKey,
        subKey,
        usageSearchKey,
        usageRevealKey,
      },
      values: {
        user,
        subscription,
        searches,
        reveals,
      },
    });
  } catch (err) {
    console.error('debug-user-kv error', err?.message || err);
    return res.status(500).json({ ok: false, error: 'Server error', detail: String(err?.message || err) });
  }
}
