// pages/api/find-company.js
// Purpose: reliably fetch a small sample from Hunter (limit=10), handle plan pagination_error,
// map hunter.data.emails -> out.contacts (including confidence -> score), and return hunter_raw for debugging.
// Use this file while we verify small-sample behavior. After verifying, we can remove hunter_raw and re-enable caching rules you prefer.

const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours in-memory cache
const cache = new Map();

function cacheKey(domain) { return `find:${domain}`; }

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  const txt = await res.text();
  try { return JSON.parse(txt); } catch (e) { return null; }
}

function extractMeta(html) {
  const text = html || '';
  const ogDesc = text.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const ogImg = text.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const metaDesc = text.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const ogTitle = text.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i)
    || text.match(/<title[^>]*>([^<]+)<\/title>/i);
  return {
    description: (ogDesc && ogDesc[1]) || (metaDesc && metaDesc[1]) || '',
    image: (ogImg && ogImg[1]) || '',
    title: (ogTitle && ogTitle[1]) || ''
  };
}

function clearbitLogo(domain) {
  if (!domain) return null;
  return `https://logo.clearbit.com/${domain}`;
}

async function fetchWikipediaSummary(query) {
  try {
    const sUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&origin=*&srsearch=${encodeURIComponent(query)}&srlimit=1`;
    const s = await fetchJson(sUrl);
    if (!s || !s.query || !s.query.search || s.query.search.length === 0) return null;
    const title = s.query.search[0].title;
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const summary = await fetchJson(summaryUrl);
    if (!summary) return null;
    return {
      description: summary.extract || '',
      image: (summary && summary.thumbnail && summary.thumbnail.source) ? summary.thumbnail.source : null,
      url: summary && summary.content_urls && summary.content_urls.desktop ? summary.content_urls.desktop.page : null
    };
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  const domainQuery = (req.query.domain || '').toString().trim().toLowerCase();
  if (!domainQuery) {
    res.status(400).json({ error: 'domain required' });
    return;
  }

  const nocache = req.query.nocache === '1';
  const key = cacheKey(domainQuery);
  const now = Date.now();
  if (!nocache) {
    const cached = cache.get(key);
    if (cached && (now - cached.ts) < CACHE_TTL_MS) {
      res.setHeader('x-cache', 'HIT');
      res.status(200).json(cached.val);
      return;
    }
  }

  const out = {
    company: { name: domainQuery, domain: domainQuery, description: null, logo: null, enrichment: null },
    contacts: [],
    total: 0,
    shown: 0,
    hunter_raw: null
  };

  const HUNTER_API_KEY = process.env.HUNTER_API_KEY || null;
  if (!HUNTER_API_KEY) {
    res.status(500).json({ error: 'HUNTER_API_KEY not set', out });
    return;
  }

  // Helper to call Hunter domain-search
  async function callHunter(limit = 10, offset = 0) {
    const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domainQuery)}&limit=${limit}&offset=${offset}&api_key=${encodeURIComponent(HUNTER_API_KEY)}`;
    const r = await fetch(hunterUrl);
    const text = await r.text().catch(() => null);
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch (e) { json = null; }
    return { status: r.status, ok: r.ok, json, text };
  }

  // Try safe small page size; if Hunter returns a pagination_error, retry with smaller limit
  let hunterRes = null;
  try {
    hunterRes = await callHunter(10, 0);

    if ((!hunterRes.ok) && hunterRes.json && hunterRes.json.errors && Array.isArray(hunterRes.json.errors)) {
      const firstError = hunterRes.json.errors[0] || {};
      const id = (firstError.id || '').toString().toLowerCase();
      const details = (firstError.details || '').toString().toLowerCase();
      if (id.includes('pagination') || details.includes('limited') || details.includes('limited to')) {
        // retry with smaller page size
        hunterRes = await callHunter(5, 0);
      }
    }
  } catch (e) {
    hunterRes = hunterRes || { status: 0, ok: false, json: null, text: null };
  }

  out.hunter_raw = hunterRes;

  const data = hunterRes && hunterRes.json && hunterRes.json.data ? hunterRes.json.data : null;
  if (data) {
    // determine authoritative total
    let total = null;
    if (typeof data.total === 'number') total = data.total;
    if (total === null && data.metrics && typeof data.metrics.emails === 'number') total = data.metrics.emails;
    if (total === null && hunterRes.json && hunterRes.json.meta && typeof hunterRes.json.meta.results === 'number') total = hunterRes.json.meta.results;
    if (total === null && Array.isArray(data.emails)) total = data.emails.length;
    if (total !== null) out.total = total;

    if (Array.isArray(data.emails) && data.emails.length) {
      out.contacts = data.emails.map(e => ({
        first_name: e.first_name || '',
        last_name: e.last_name || '',
        email: e.value || e.email || '',
        position: e.position || e.position_raw || '',
        score: (e.confidence !== undefined && e.confidence !== null) ? Number(e.confidence) : (e.score !== undefined ? Number(e.score) : null),
        department: e.department || '',
        linkedin: e.linkedin || null,
        sources: e.sources || null
      })).filter(c => c.email && c.email.indexOf('@') > -1);

      out.shown = out.contacts.length;
      if (!out.total || out.total === 0) out.total = out.shown;
    }

    if (data.organization) out.company.name = data.organization;
    if (data.domain) out.company.domain = data.domain;
    out.company.enrichment = out.company.enrichment || {};
    out.company.enrichment.source = out.company.enrichment.source || 'hunter';
  }

  // OG/meta from homepage for RightPanel
  try {
    const siteUrl = `https://${domainQuery}`;
    const r = await fetch(siteUrl, { redirect: 'follow' }).catch(() => null);
    if (r && r.ok) {
      const html = await r.text().catch(() => '');
      if (html) {
        const meta = extractMeta(html);
        if (meta.description) out.company.description = out.company.description || meta.description;
        if (meta.image) out.company.logo = out.company.logo || meta.image;
        out.company.enrichment = out.company.enrichment || {};
        out.company.enrichment.url = siteUrl;
        out.company.enrichment.source = out.company.enrichment.source || 'og';
      }
    }
  } catch (e) {
    // ignore
  }

  // Wikipedia fallback
  try {
    const wikiQuery = out.company.name && out.company.name !== domainQuery ? out.company.name : domainQuery;
    const wiki = await fetchWikipediaSummary(wikiQuery);
    if (wiki) {
      if (!out.company.description || (wiki.description && wiki.description.length > (out.company.description || '').length + 20)) {
        out.company.description = out.company.description || wiki.description;
      }
      out.company.logo = out.company.logo || wiki.image;
      out.company.enrichment = out.company.enrichment || {};
      out.company.enrichment.source = out.company.enrichment.source || 'wikipedia';
      out.company.enrichment.url = out.company.enrichment.url || wiki.url;
    }
  } catch (e) { /* ignore */ }

  if (!out.company.logo) out.company.logo = clearbitLogo(domainQuery);

  out.total = typeof out.total === 'number' ? out.total : (out.contacts && out.contacts.length) || 0;
  out.shown = typeof out.shown === 'number' ? out.shown : (out.contacts && out.contacts.length) || 0;

  if (!nocache) cache.set(key, { ts: now, val: out });

  res.setHeader('x-cache', nocache ? 'BYPASS' : 'MISS');
  res.status(200).json(out);
}
