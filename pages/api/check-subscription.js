// Small helper endpoint the client can call to check whether the signed-in (local) user has an active subscription.
// The client should send the local nh_session string as header x-nh-session.
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const sessionHeader = req.headers['x-nh-session'] || null;
    if (!sessionHeader) return res.status(200).json({ subscribed: false });

    let email = null;
    try {
      const parsed = JSON.parse(sessionHeader);
      email = parsed?.email || null;
    } catch (e) {
      if (typeof sessionHeader === 'string' && sessionHeader.includes('@')) email = sessionHeader;
    }

    if (!email) return res.status(200).json({ subscribed: false });

    const key = `stripe:subscription:${email.toLowerCase()}`;
    try {
      const sub = await kv.get(key);
      if (!sub) return res.status(200).json({ subscribed: false });
      // treat active statuses (trialing, active) as subscribed
      const active = ['active', 'trialing'].includes((sub.status || '').toLowerCase());
      return res.status(200).json({ subscribed: active, subscription: sub });
    } catch (e) {
      console.warn('KV read error (check-subscription)', e);
      return res.status(200).json({ subscribed: false });
    }
  } catch (err) {
    console.error('check-subscription error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
