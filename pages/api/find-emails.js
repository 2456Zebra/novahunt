// pages/api/find-emails.js
// Uses global fetch (Node 18+). No node-fetch required.
// Returns Hunter domain-search results normalized. Caches per-function-instance.

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

export default async function handler(req, res) {
  const domain = String((req.query && req.query.domain) || '').trim();
  if (!domain) return res.status(400).json({ ok: false, error: 'Missing domain' });

  const key = `hunter:${domain}`;
  const cached = cacheGet(key);
  if (cached) return res.status(200).json({ ok: true, items: cached.items, total: cached.total });

  if (!HUNTER_KEY) return res.status(500).json({ ok: false, error: 'HUNTER_API_KEY missing in env' });

  try {
    const json = await callHunterDomainSearch(domain);
    const items = normalizeHunterItems(json);
    const total = items.length;
    cacheSet(key, { items, total });
    return res.status(200).json({ ok: true, items, total });
  } catch (err) {
    console.error('find-emails hunter error', err && err.message);
    return res.status(500).json({ ok: false, error: 'Hunter lookup failed' });
  }
}
