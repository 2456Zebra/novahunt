// Accepts POST { type: 'search'|'reveal' | 'searches'|'reveals', amount?: number }
// Auth via X-NH-SESSION header (token) or body.session (fallback).
// Uses lib/user-store.js getUserBySession & incrementUsage.

import { getUserBySession, incrementUsage } from '../../../lib/user-store';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).end();
  }

  // Accept session token either via header or body
  const sessionHeader = req.headers['x-nh-session'] || (req.body && req.body.session);
  if (!sessionHeader) return res.status(401).json({ error: 'Unauthorized' });

  const session = await getUserBySession(sessionHeader);
  if (!session?.email) return res.status(401).json({ error: 'Unauthorized' });

  // Normalize type aliases: allow 'search','searches' => 'search'; 'reveal','reveals' => 'reveal'
  let { type, amount } = req.body || {};
  amount = typeof amount === 'number' ? amount : 1;
  if (!type || typeof type !== 'string') return res.status(400).json({ error: 'type is required' });

  const t = type.toLowerCase();
  let normalized;
  if (t === 'search' || t === 'searches') normalized = 'search';
  else if (t === 'reveal' || t === 'reveals') normalized = 'reveal';
  else return res.status(400).json({ error: 'invalid type' });

  const result = await incrementUsage(session.email, normalized, amount);
  return res.status(200).json({ ok: true, usage: result });
}
