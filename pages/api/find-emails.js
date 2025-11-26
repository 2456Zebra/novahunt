import axios from 'axios';

const HUNTER_KEY = process.env.HUNTER_API_KEY || '';
const PAGE_SIZE = Number(process.env.HUNTER_PAGE_SIZE || 50);
const CACHE_TTL = Number(process.env.FIND_EMAILS_CACHE_TTL_MS || 5 * 60 * 1000);

if (!global.__nh_hunter_cache) global.__nh_hunter_cache = new Map();
const CACHE = global.__nh_hunter_cache;

function now() {
  return Date.now();
}

function cacheGet(key) {
  const rec = CACHE.get(key);
  if (!rec) return null;
  if (now() - rec.ts > CACHE_TTL) {
    CACHE.delete(key);
    return null;
  }
  return rec.val;
}

function cacheSet(key, val) {
  try {
    CACHE.set(key, { val, ts: now() });
  } catch (e) {
    // ignore cache failures
  }
}

function normalizeEmails(rawEmails) {
  if (!Array.isArray(rawEmails)) return [];
  return rawEmails.map((e) => ({
    email: e.value || '',
    first_name: e.first_name || '',
    last_name: e.last_name || '',
    position: e.position || e.title || '',
    department: e.department || '',
    confidence: typeof e.confidence === 'number' ? e.confidence : (e.score || null),
    sources: e.sources || [],
    raw: e,
  }));
}

export default async function handler(req, res) {
  const domainParam = String((req.query && req.query.domain) || '').trim();
  if (!domainParam) {
    return res.status(400).json({ ok: false, error: 'domain query parameter is required' });
  }

  // sanitize domain (remove protocol/path)
  const domain = domainParam.replace(/^https?:\/\//i, '').split('/')[0].toLowerCase();
  if (!domain || domain.includes('..') || domain.includes('/') || domain.includes('\\')) {
    return res.status(400).json({ ok: false, error: 'invalid domain' });
  }

  const cacheKey = 'hunter:' + domain + ':p' + PAGE_SIZE;
  const cached = cacheGet(cacheKey);
  if (cached) {
    return res.status(200).json({ ok: true, cached: true, domain, emails: cached.emails, total: cached.total });
  }

  if (!HUNTER_KEY) {
    return res.status(500).json({ ok: false, error: 'Hunter API key not configured on server.' });
  }

  try {
    const url =
      'https://api.hunter.io/v2/domain-search?domain=' +
      encodeURIComponent(domain) +
      '&limit=' +
      encodeURIComponent(String(PAGE_SIZE)) +
      '&api_key=' +
      encodeURIComponent(HUNTER_KEY);

    const r = await axios.get(url, { timeout: 10000 });
    const emailsRaw = (r.data && r.data.data && r.data.data.emails) ? r.data.data.emails : [];
    const total = (r.data && r.data.meta && typeof r.data.meta.total === 'number') ? r.data.meta.total : (emailsRaw.length || 0);

    const normalized = normalizeEmails(emailsRaw);
    cacheSet(cacheKey, { emails: normalized, total });

    return res.status(200).json({ ok: true, cached: false, domain, emails: normalized, total });
  } catch (err) {
    // try to produce a friendly error
    const hunterMessage = (err && err.response && err.response.data) ? err.response.data : err.message || String(err);
    return res.status(502).json({ ok: false, error: 'Hunter API error', details: hunterMessage });
  }
}
