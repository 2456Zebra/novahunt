import axios from 'axios';

const PAGE_SIZE = parseInt(process.env.HUNTER_PAGE_SIZE || '50', 10);
const CACHE_TTL = parseInt(process.env.FIND_EMAILS_CACHE_TTL_MS || String(5 * 60 * 1000), 10); // ms
const HUNTER_KEY = process.env.HUNTER_API_KEY || '';

if (!global.__hunterCache) {
  global.__hunterCache = Object.create(null);
}
const cache = global.__hunterCache;

function now() {
  return Date.now();
}

export default async function handler(req, res) {
  const { domain } = req.query || {};

  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ ok: false, error: 'domain query parameter is required' });
  }

  const d = domain.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];

  // Basic validation
  if (!d || d.includes('..') || d.includes('/') || d.includes('\')) {
    return res.status(400).json({ ok: false, error: 'invalid domain' });
  }

  // Return cached if fresh
  const cached = cache[d];
  if (cached && now() - cached.ts < CACHE_TTL) {
    return res.status(200).json({ ok: true, cached: true, domain: d, emails: cached.emails, total: cached.total });
  }

  if (!HUNTER_KEY) {
    return res.status(500).json({ ok: false, error: 'Hunter API key not configured on server.' });
  }

  try {
    const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(d)}&limit=${PAGE_SIZE}&api_key=${encodeURIComponent(HUNTER_KEY)}`;
    const r = await axios.get(url, { timeout: 10000 });

    const emails = (r.data && r.data.data && r.data.data.emails) ? r.data.data.emails : [];
    const total = (r.data && r.data.meta && typeof r.data.meta.total === 'number') ? r.data.meta.total : emails.length;

    // normalize email items so frontend can rely on fields
    const normalized = emails.map((e) => ({
      email: e.value || e.email || '',
      first_name: e.first_name || e.firstName || '',
      last_name: e.last_name || e.lastName || '',
      position: e.position || e.title || '',
      source: e.sources && e.sources.length ? e.sources[0].source : (e.sources?.[0]?.url || ''),
      confidence: e.confidence || e.score || null,
      raw: e,
    }));

    // cache
    cache[d] = { ts: now(), emails: normalized, total };

    return res.status(200).json({ ok: true, cached: false, domain: d, emails: normalized, total });
  } catch (err) {
    console.error('find-emails error', err && err.toString ? err.toString() : err);
    const message = (err?.response?.data?.errors && err.response.data.errors[0]?.details) || err?.response?.data?.message || 'Hunter API error';
    return res.status(502).json({ ok: false, error: message });
  }
}