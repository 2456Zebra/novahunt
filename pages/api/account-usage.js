// pages/api/account-usage.js
// Endpoint used by /account page. Returns usage in the shape pages/account.js expects:
// { email, plan, used: { searches, reveals }, limits: { searches, reveals } }

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
    const body = {
      email: user.email,
      plan: (user.metadata && user.metadata.plan) ? user.metadata.plan : 'Free',
      used: {
        searches: usage.searchesUsed || 0,
        reveals: usage.revealsUsed || 0
      },
      limits: {
        searches: usage.searchesTotal || 0,
        reveals: usage.revealsTotal || 0
      }
    };
    return res.status(200).json(body);
  } catch (err) {
    console.error('account-usage error', err && (err.message || err));
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
