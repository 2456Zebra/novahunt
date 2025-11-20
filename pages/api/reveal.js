// pages/api/reveal.js — sketch: accept x-nh-session header or cookie; verify via lib/session.getUserBySession
const { getUserBySession } = require('../../lib/session');
const { incrementUsage, getUsageForUser } = require('../../lib/user-store');

// This file assumes other reveal logic below; the important part is session extraction and check.
// Replace or merge into your existing reveal handler. Here we show how to extract/verify session:
async function extractSessionToken(req) {
  const header = (req.headers && req.headers['x-nh-session']) || '';
  if (header) return (typeof header === 'string') ? header : String(header);
  // fallback to cookie header parse (minimal)
  const cookie = req.headers.cookie || '';
  const m = cookie.match(/nh_session=([^;]+)/);
  return m ? m[1] : '';
}

export default async function handler(req, res) {
  try {
    const sessionToken = await extractSessionToken(req);
    const payload = sessionToken ? getUserBySession(sessionToken) : null;
    if (!payload) {
      // Not authenticated — respond 401 for reveal requests
      return res.status(401).json({ ok: false, error: 'Authentication required' });
    }

    const userId = payload.sub;
    
    // Increment reveals usage
    const usage = await incrementUsage(userId, { reveals: 1 });
    
    // TODO: your existing reveal logic goes here.
    // For example: validate contactId, check usage limits, perform reveal, persist usage.
    // Below is a minimal placeholder response:
    const revealed = { email: req.body?.email || 'revealed@example.com' };
    return res.status(200).json({ ok: true, revealed, usage });
  } catch (err) {
    console.error('reveal error', err?.message || err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
