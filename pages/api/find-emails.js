// pages/api/find-emails.js
// Hunter domain search + authenticated usage increment and usage return
// Adds a short server-side info log to help diagnose counts vs UI.

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
    const err = new Error(`Hunter domain-search failed ${res.status}`);
    err.hunter = { status: res.status, url, body: text };
    throw err;
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
  const session = extractSessionToken(req);

  if (cached) {
    try {
      if (session) {
        const payload = getUserBySession(session);
        if (payload && payload.sub) {
          const usageBefore = await getUsageForUser(payload.sub);
          const searchesUsed = usageBefore.searchesUsed || 0;
          const searchesTotal = usageBefore.searchesTotal || 0;
          if (searchesTotal > 0 && searchesUsed >= searchesTotal) {
            return res.status(402).json({ ok: false, error: 'Search quota exceeded' });
          }
          await incrementUsage(payload.sub, { searches: 1 });
          const usage = await getUsageForUser(payload.sub);
          return res.status(200).json({ ok: true, items: cached.items, total: cached.total, usage });
        }
      }
    } catch (e) { /* ignore usage increment failures for cache hits */ }
    return res.status(200).json({ ok: true, items: cached.items, total: cached.total });
  }

  if (!HUNTER_KEY) {
    console.error('find-emails: HUNTER_API_KEY missing in environment (Production must have HUNTER_API_KEY).');
    return res.status(500).json({ ok: false, error: 'HUNTER_API_KEY missing in env' });
  }

  try {
    if (session) {
      try {
        const payload = getUserBySession(session);
        if (payload && payload.sub) {
          const usageBefore = await getUsageForUser(payload.sub);
          const searchesUsed = usageBefore.searchesUsed || 0;
          const searchesTotal = usageBefore.searchesTotal || 0;
          if (searchesTotal > 0 && searchesUsed >= searchesTotal) {
            return res.status(402).json({ ok: false, error: 'Search quota exceeded' });
          }
        }
      } catch (e) {
        console.error('find-emails usage check failed', e && (e.message || e));
      }
    }

    const json = await callHunterDomainSearch(domain);
    const items = normalizeHunterItems(json);

    // Prefer the Hunter-reported total when available
    const hunterTotal = (json && json.data && (json.data.total || (json.data.meta && json.data.meta.total))) || null;
    const total = Number.isFinite(hunterTotal) && hunterTotal >= 0 ? hunterTotal : items.length;

    // server-side debug/info log so you can inspect counts in Vercel logs
    try {
      console.info('find-emails success', { domain, normalizedItems: items.length, hunterTotal });
    } catch (e) {}

    cacheSet(key, { items, total });

    if (session) {
      try {
        const payload = getUserBySession(session);
        if (payload && payload.sub) {
          const usage = await incrementUsage(payload.sub, { searches: 1 });
          return res.status(200).json({ ok: true, items, total, usage });
        }
      } catch (e) {
        console.error('find-emails increment usage error', e && (e.message || e));
        return res.status(200).json({ ok: true, items, total });
      }
    }

    return res.status(200).json({ ok: true, items, total });
  } catch (err) {
    if (err && err.hunter) {
      console.error('find-emails hunter error:', {
        message: err.message,
        hunterStatus: err.hunter.status,
        hunterUrl: err.hunter.url,
        hunterBodyPreview: String(err.hunter.body || '').slice(0, 200)
      });
    } else {
      console.error('find-emails hunter error', err && (err.message || err));
    }
    return res.status(500).json({ ok: false, error: 'Hunter lookup failed' });
  }
}