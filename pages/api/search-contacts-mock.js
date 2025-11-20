// Mock search endpoint for local/testing UI (does NOT call Hunter).
// Use this temporarily while we verify the real API key.
const { getUserBySession } = require('../../lib/session');
const { incrementUsage } = require('../../lib/user-store');

async function extractSessionToken(req) {
  const header = (req.headers && req.headers['x-nh-session']) || '';
  if (header) return (typeof header === 'string') ? header : String(header);
  // fallback to cookie header parse (minimal)
  const cookie = req.headers.cookie || '';
  const m = cookie.match(/nh_session=([^;]+)/);
  return m ? m[1] : '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }
  const { domain } = req.body || {};
  if (!domain) return res.status(400).json({ error: 'domain required' });

  // Extract session and increment usage if authenticated
  let usage = null;
  try {
    const sessionToken = await extractSessionToken(req);
    const payload = sessionToken ? getUserBySession(sessionToken) : null;
    if (payload && payload.sub) {
      usage = await incrementUsage(payload.sub, { searches: 1 });
    }
  } catch (err) {
    console.warn('Usage tracking error:', err?.message || err);
  }

  // Simple deterministic mock for testing
  const sample = {
    data: {
      data: {
        domain,
        emails: [
          {
            value: 'alex.smith@' + domain,
            first_name: 'Alex',
            last_name: 'Smith',
            position: 'Model Scout',
            department: 'scouting',
            type: 'personal',
            confidence: 95,
            verification: { status: 'valid', date: '2025-11-01' },
            sources: [{ uri: 'https://example.com/profile/alex-smith', extracted_on: '2025-01-01', last_seen_on: '2025-11-01' }]
          },
          {
            value: 'info@' + domain,
            first_name: '',
            last_name: '',
            position: 'Contact',
            department: 'general',
            type: 'generic',
            confidence: 60,
            verification: { status: null },
            sources: []
          }
        ]
      },
      meta: { results: 2, limit: 10, offset: 0 }
    }
  };

  return res.status(200).json({ ...sample, usage });
}
