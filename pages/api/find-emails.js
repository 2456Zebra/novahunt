// pages/api/find-emails.js
// Hunter domain search + optional authenticated usage increment and usage return
// Uses global fetch. Requires HUNTER_API_KEY for Hunter lookups.
// This version will increment searches for an authenticated user and return updated usage.

const { getUserBySession } = require('../../lib/session');
const { incrementUsage, getUsageForUser } = require('../../lib/user-store');

const HUNTER_KEY = process.env.HUNTER_API_KEY || '';
const CACHE = new Map();
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

function cacheSet(key, value) {
  CACHE.set(key, { value, t: Date.now() });
}
function cacheGet(key) {
  const rec = CACHE.get(key);
  if (!rec) return null;
  if (Date.now() - rec.t > CACHE_TTL_MS) { CACHE.delete(key); return null; }
  return rec.value;
}

async function callHunterDomainSearch(domain) {
  const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${encodeURIComponent(HUNTER_KEY)}`;
  const res = await global.fetch(url, { method: 'GET' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Hunter domain-search failed ${res.status}: ${text}`);
  }
  const json = await res.json();
  return json;
}

function normalizeHunterItems(json) {
  try {
    const emails = (json && json.data && json.data.emails) ? json.data.emails : [];
    return emails.map(e => ({
      email: e.value,
      name: [e.first_name, e.last_name].filter(Boolean).join(' ') || '',
      title: e.position || '',
      confidence: (typeof e.confidence === 'number') ? (e.confidence / 100) : (e.score ? e.score : 0),
      source: (e.sources && e.sources[0] && e.sources[0].uri) ? e.sources[0].uri : ''
    }));
  } catch (e) {
    return [];
  }
}

function extractSessionToken(req) {
  const header = req.headers && (req.headers['x-nh-session'] || req.headers['x-nh-session'.toLowerCase()]);
  if (header) return (typeof header === 'string') ? header : String(header);
  const cookie = req.headers && req.headers.cookie ? req.headers.cookie : '';
  const m = cookie.match(/nh_session=([^;]+)/);
  return m ? m[1] : '';
}

export default async function handler(req, res) {
  const domain = String((req.query && req.query.domain) || '').trim();
  if (!domain) return res.status(400).json({ ok: false, error: 'Missing domain' });

  const key = `hunter:${domain}`;
  const cached = cacheGet(key);
  if (cached) {
    // If cached and user is authenticated we still want to return usage (so client updates)
    try {
      const session = extractSessionToken(req);
      if (session) {
        const payload = getUserBySession(session);
        if (payload && payload.sub) {
          // increment searches for authenticated user (best-effort, no-throw)
          await incrementUsage(payload.sub, { searches: 1 });
          const usage = await getUsageForUser(payload.sub);
          return res.status(200).json({ ok: true, items: cached.items, total: cached.total, usage });
        }
      }
    } catch (e) { /* ignore usage increment failures for cache hits */ }
    return res.status(200).json({ ok: true, items: cached.items, total: cached.total });
  }

  if (!HUNTER_KEY) return res.status(500).json({ ok: false, error: 'HUNTER_API_KEY missing in env' });

  try {
    // call Hunter
    const json = await callHunterDomainSearch(domain);
    const items = normalizeHunterItems(json);
    const total = items.length;
    cacheSet(key, { items, total });

    // If user authenticated, increment usage and include it in response
    const session = extractSessionToken(req);
    if (session) {
      try {
        const payload = getUserBySession(session);
        if (payload && payload.sub) {
          const usage = await incrementUsage(payload.sub, { searches: 1 });
          return res.status(200).json({ ok: true, items, total, usage });
        }
      } catch (e) {
        console.error('find-emails increment usage error', e && (e.message || e));
        // fallback to returning results without usage
        return res.status(200).json({ ok: true, items, total });
      }
    }

    // unauthenticated response (no usage)
    return res.status(200).json({ ok: true, items, total });
  } catch (err) {
    console.error('find-emails hunter error', err && err.message);
    return res.status(500).json({ ok: false, error: 'Hunter lookup failed' });
  }
}
