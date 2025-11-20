// pages/api/usage.js
// Lightweight usage endpoint used by header snippets / UI.
// Returns a compact usage object for the authenticated user.

const { getUserBySession } = require('../../lib/session');
const { getUsageForUser, getUserById } = require('../../lib/user-store');

function extractSessionToken(req) {
  const header = req.headers && (req.headers['x-nh-session'] || req.headers['x-nh-session'.toLowerCase()]);
  if (header) return (typeof header === 'string') ? header : String(header);
  const cookie = req.headers && req.headers.cookie ? req.headers.cookie : '';
  const m = cookie.match(/nh_session=([^;]+)/);
  return m ? m[1] : '';
}

export default async function handler(req, res) {
  try {
    const session = extractSessionToken(req);
    if (!session) return res.status(401).json({ ok: false, error: 'Authentication required' });

    const payload = getUserBySession(session);
    if (!payload || !payload.sub) return res.status(401).json({ ok: false, error: 'Invalid session' });

    const user = await getUserById(payload.sub);
    if (!user) return res.status(404).json({ ok: false, error: 'User not found' });

    const usage = await getUsageForUser(payload.sub);
    // Normalize to a compact shape used by UI components
    const response = {
      ok: true,
      email: user.email,
      plan: (user.metadata && user.metadata.plan) ? user.metadata.plan : 'Free',
      searches: usage.searchesUsed || 0,
      reveals: usage.revealsUsed || 0,
      limits: {
        searches: usage.searchesTotal || 0,
        reveals: usage.revealsTotal || 0
      }
    };
    return res.status(200).json(response);
  } catch (err) {
    console.error('usage endpoint error', err && (err.message || err));
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
