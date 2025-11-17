import { appendEvent } from '../../lib/tracker';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = req.body || {};
    const { userId, eventType, payload } = body;

    if (!eventType || typeof eventType !== 'string') {
      return res.status(400).json({ ok: false, error: 'eventType is required' });
    }

    if (userId && typeof userId !== 'string') {
      return res.status(400).json({ ok: false, error: 'userId must be a string' });
    }

    await appendEvent({
      userId: userId || null,
      eventType,
      payload: payload || {},
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('track-event error', err && err.message ? err.message : err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}