// pages/api/reveal.js — accept x-nh-session header or cookie; verify via lib/session.getUserBySession
const { getUserBySession } = require('../../lib/session');
const { incrementUsage, getUserById } = require('../../lib/user-store');

async function extractSessionToken(req) {
  const header = (req.headers && (req.headers['x-nh-session'] || req.headers['x-nh-session'.toLowerCase()])) || '';
  if (header) return (typeof header === 'string') ? header : String(header);
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
    // increment reveals usage
    const usage = await incrementUsage(userId, { reveals: 1 });

    // TODO: merge this with your existing reveal logic.
    // For example: validate contactId, check usage limits, perform reveal, persist usage.
    // Minimal placeholder reveal response:
    const revealed = { email: req.body?.email || 'revealed@example.com' };

    return res.status(200).json({ ok: true, revealed, usage });
  } catch (err) {
    console.error('reveal error', err?.message || err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
