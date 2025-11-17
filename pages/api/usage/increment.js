import { getUserBySession, incrementUsage } from '../../../lib/user-store';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Accept session token either via X-NH-SESSION header or body.session
    const sessionHeader = req.headers['x-nh-session'] || (req.body && req.body.session);
    if (!sessionHeader) return res.status(401).json({ error: 'Unauthorized' });

    const sessionUser = await getUserBySession(sessionHeader);
    if (!sessionUser || !sessionUser.email) return res.status(401).json({ error: 'Unauthorized' });

    // Normalize type aliases: allow 'search','searches' => 'search'; 'reveal','reveals' => 'reveal'
    let { type, amount } = req.body || {};
    amount = typeof amount === 'number' ? amount : 1;
    if (!type || typeof type !== 'string') return res.status(400).json({ error: 'type is required' });

    const t = type.toLowerCase();
    let normalized;
    if (t === 'search' || t === 'searches') normalized = 'search';
    else if (t === 'reveal' || t === 'reveals') normalized = 'reveal';
    else return res.status(400).json({ error: 'invalid type' });

    const result = await incrementUsage(sessionUser.email, normalized, amount);
    return res.status(200).json({ ok: true, usage: result });
  } catch (err) {
    console.error('usage/increment error', err?.message || err);
    return res.status(500).json({ error: 'Server error' });
  }
}
