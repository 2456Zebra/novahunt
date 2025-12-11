// Serverless enrichment endpoint.
// - Uses Hunter domain-search (server-side) to get authoritative totals/contacts when HUNTER_API_KEY is set.
// - Fetches the company's homepage (server-side) and extracts OpenGraph/meta tags for description and image.
// - Returns a compact enrichment object: { image, description, url, source, total, shown }
// - Simple in-memory cache included (ttlMs = 12 hours). For production use a persistent cache (Redis/Upstash).
//
// Required env:
// - HUNTER_API_KEY: your Hunter API key (set in Vercel/Netlify/AWS env settings)
//
// Usage:
// GET /api/enrich-company?domain=coca-cola.com
//
// NOTE: This function is intentionally defensive — if Hunter is not available or key is missing,
// it still attempts to fetch the website and extract OG/meta info and falls back to Clearbit logo.

const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const cache = new Map();

function cacheKey(domain) {
  return `enrich:${domain}`;
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  const txt = await res.text();
  try { return JSON.parse(txt); } catch (e) { return null; }
}

function extractMeta(html) {
  try {
    const lower = html;
    // og:description
    const ogDescMatch = lower.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const ogImgMatch = lower.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const metaDescMatch = lower.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const titleMatch = lower.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i)
      || lower.match(/<title[^>]*>([^<]+)<\/title>/i);

    const description = (ogDescMatch && ogDescMatch[1]) || (metaDescMatch && metaDescMatch[1]) || '';
    const image = (ogImgMatch && ogImgMatch[1]) || '';
    const title = (titleMatch && titleMatch[1]) || '';
    return { description: description.trim(), image: image.trim(), title: title.trim() };
  } catch (e) {
    return { description: '', image: '', title: '' };
  }
}

export default async function handler(req, res) {
  const domainParam = (req.query.domain || '').toString().trim().toLowerCase();
  if (!domainParam) {
    res.status(400).json({ error: 'domain required' });
    return;
  }
  const key = cacheKey(domainParam);
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && (now - cached.ts) < CACHE_TTL_MS) {
    res.setHeader('x-cache', 'HIT');
    res.status(200).json(cached.val);
    return;
  }

  const out = { image: null, description: null, url: `https://${domainParam}`, source: null, total: null, shown: null };

  // 1) Try Hunter (if API key present)
  const HUNTER_API_KEY = process.env.HUNTER_API_KEY || process.env.NEXT_PUBLIC_HUNTER_API_KEY;
  if (HUNTER_API_KEY) {
    try {
      const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domainParam)}&limit=1&api_key=${encodeURIComponent(HUNTER_API_KEY)}`;
      const hunter = await fetchJson(hunterUrl);
      // Hunter response shape is defensive here
      const data = hunter && hunter.data ? hunter.data : (hunter && hunter.data ? hunter.data : null);
      // Try to get counts
      let total = null;
      if (data) {
        // Hunter v2 might return "total" or we can use emails length
        if (typeof data.total === 'number') total = data.total;
        else if (Array.isArray(data.emails)) total = data.emails.length;
        else if (data.metrics && typeof data.metrics.emails === 'number') total = data.metrics.emails;
      }
      if (total !== null) out.total = total;
      // We can set source to hunter (used by UI if desired)
      out.source = 'hunter';
    } catch (e) {
      // ignore hunter errors - continue to try OG scrape
      console.warn('hunter failed', e && e.message);
    }
  }

  // 2) Fetch the site homepage and extract OG/meta tags for description/logo
  try {
    const siteUrl = `https://${domainParam}`;
    const r = await fetch(siteUrl, { redirect: 'follow', timeout: 8000 }).catch(() => null);
    if (r && r.ok) {
      const txt = await r.text().catch(() => '');
      const meta = extractMeta(txt);
      if (meta.description) out.description = meta.description;
      if (meta.image) out.image = meta.image;
      if (meta.title && (!out.name)) out.name = meta.title;
      out.source = out.source || 'og';
    }
  } catch (e) {
    // ignore
  }

  // 3) Fallback logo: Clearbit logo service (no API key)
  if (!out.image) {
    out.image = `https://logo.clearbit.com/${domainParam}`;
  }

  // 4) If Hunter gave no total, try to infer total from an alternate source (not implemented) — leave null

  // store in cache
  cache.set(key, { ts: now, val: out });
  res.setHeader('x-cache', 'MISS');
  res.status(200).json(out);
}
