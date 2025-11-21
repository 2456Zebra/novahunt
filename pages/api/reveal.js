// pages/api/reveal.js
// Enforce per-user reveal quota before returning reveals and increment usage after success.

const { getUserBySession } = require('../../lib/session');
const { incrementUsage, getUsageForUser } = require('../../lib/user-store');

async function extractSessionToken(req) {
  const header = (req.headers && (req.headers['x-nh-session'] || req.headers['x-nh-session'.toLowerCase()])) || '';
  if (header) return (typeof header === 'string') ? header : String(header);
  const cookie = req.headers && req.headers.cookie ? req.headers.cookie : '';
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

    // Check user's reveal quota before performing the reveal
    try {
      const usageBefore = await getUsageForUser(userId);
      const revealsUsed = usageBefore.revealsUsed || 0;
      const revealsTotal = usageBefore.revealsTotal || 0;
      if (revealsTotal > 0 && revealsUsed >= revealsTotal) {
        return res.status(402).json({ ok: false, error: 'Reveal quota exceeded' });
      }
    } catch (e) {
      console.error('reveal usage check failed', e && (e.message || e));
      // proceed if usage lookup fails (but log it)
    }

    // TODO: replace this placeholder with your real reveal implementation.
    // Validate contactId, call your data source, etc.
    const contactId = req.body?.contactId || '';
    const revealed = { email: req.body?.email || `revealed+${Date.now()}@example.com` };

    // After successful reveal, increment reveals usage and return updated usage
    const usage = await incrementUsage(userId, { reveals: 1 });

    return res.status(200).json({ ok: true, revealed, usage });
  } catch (err) {
    console.error('reveal error', err?.message);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}