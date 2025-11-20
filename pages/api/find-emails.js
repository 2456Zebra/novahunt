// Minimal /api/find-emails implementation: returns demo items and increments searches usage for authenticated users.
const { getUserBySession } = require('../../lib/session');
const { incrementUsage } = require('../../lib/user-store');

function sampleLeadsFor(domain) {
  const d = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] || 'example.com';
  const base = d.includes('.') ? d : `${d}.com`;
  return [
    { email: `john.doe@${base}`, name: 'John Doe', title: 'Head of Marketing', confidence: 0.92 },
    { email: `jane.smith@${base}`, name: 'Jane Smith', title: 'VP Sales', confidence: 0.87 },
    { email: `marketing@${base}`, name: '', title: 'Marketing', confidence: 0.80 },
    { email: `press@${base}`, name: '', title: 'Press', confidence: 0.66 },
    { email: `info@${base}`, name: '', title: 'Info', confidence: 0.55 },
  ];
}

async function extractSessionToken(req) {
  const header = (req.headers && (req.headers['x-nh-session'] || req.headers['x-nh-session'.toLowerCase()])) || '';
  if (header) return (typeof header === 'string') ? header : String(header);
  const cookie = req.headers.cookie || '';
  const m = cookie.match(/nh_session=([^;]+)/);
  return m ? m[1] : '';
}

export default async function handler(req, res) {
  try {
    const domain = String((req.query && req.query.domain) || 'example.com');
    // demo items
    const items = sampleLeadsFor(domain);
    let total = items.length;

    // try to increment usage if authenticated
    const sessionToken = await extractSessionToken(req);
    const payload = sessionToken ? getUserBySession(sessionToken) : null;
    let usage = null;
    if (payload && payload.sub) {
      usage = await incrementUsage(payload.sub, { searches: 1 });
    }

    return res.status(200).json({ ok: true, items, total, usage });
  } catch (err) {
    console.error('find-emails error', err?.message || err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
