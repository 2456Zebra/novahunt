// /api/find-company
// Ensures Hunter emails are mapped into payload.contacts and total/shown are set reliably.
// Also returns hunter_raw for debugging (safe to remove later).
//
// Usage: GET /api/find-company?domain=coca-cola.com
// Requirements: HUNTER_API_KEY env var set in production.

const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const cache = new Map();

function cacheKey(domain) { return `find:${domain}`; }

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  const txt = await res.text();
  try { return JSON.parse(txt); } catch (e) { return null; }
}

function clearbitLogo(domain) {
  if (!domain) return null;
  return `https://logo.clearbit.com/${domain}`;
}

function extractMeta(html) {
  try {
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
  } catch (e) {
    return { description: '', image: '', title: '' };
  }
}

async function fetchWikipediaHint(query) {
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
      source: 'wikipedia',
      url: summary.content_urls && summary.content_urls.desktop && summary.content_urls.desktop.page ? summary.content_urls.desktop.page : null
    };
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  const domainReq = (req.query.domain || '').toString().trim().toLowerCase();
  if (!domainReq) {
    res.status(400).json({ error: 'domain required' });
    return;
  }

  const key = cacheKey(domainReq);
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && (now - cached.ts) < CACHE_TTL_MS) {
    res.setHeader('x-cache', 'HIT');
    res.status(200).json(cached.val);
    return;
  }

  const out = {
    company: { name: domainReq, domain: domainReq, description: null, logo: null, enrichment: null },
    contacts: [],
    total: 0,
    shown: 0,
    hunter_raw: null
  };

  const HUNTER_API_KEY = process.env.HUNTER_API_KEY || null;

  // 1) Hunter integration
  if (HUNTER_API_KEY) {
    try {
      // Request a reasonable sample (limit up to 100 for testing if your plan allows)
      const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domainReq)}&limit=100&api_key=${encodeURIComponent(HUNTER_API_KEY)}`;
      const hunterRes = await fetch(hunterUrl);
      const hunterText = await hunterRes.text().catch(() => null);
      let hunterJson = null;
      try { hunterJson = hunterText ? JSON.parse(hunterText) : null; } catch (e) { hunterJson = null; }

      out.hunter_raw = { status: hunterRes.status, ok: hunterRes.ok, json: hunterJson, text: hunterText };

      const data = hunterJson && hunterJson.data ? hunterJson.data : null;
      if (data) {
        // Extract authoritative total
        let total = null;
        if (typeof data.total === 'number') total = data.total;
        if (total === null && data.metrics && typeof data.metrics.emails === 'number') total = data.metrics.emails;
        if (total === null && hunterJson && hunterJson.meta && typeof hunterJson.meta.results === 'number') total = hunterJson.meta.results;
        if (total === null && Array.isArray(data.emails) && data.emails.length) total = data.emails.length;
        if (total !== null) out.total = total;

        // Map emails to contacts if present
        if (Array.isArray(data.emails) && data.emails.length) {
          out.contacts = data.emails.map(e => ({
            first_name: e.first_name || '',
            last_name: e.last_name || '',
            email: e.value || e.email || '',
            position: e.position || e.position_raw || e.title || '',
            score: e.confidence || e.score || null,
            department: e.department || '',
            linkedin: e.linkedin || null,
            sources: e.sources || null,
          })).filter(c => c.email && c.email.indexOf('@') > -1);

          out.shown = out.contacts.length;
          if (!out.total || out.total === 0) out.total = out.shown;
        }

        if (data.organization) out.company.name = data.organization;
        if (data.domain) out.company.domain = data.domain;
        out.company.enrichment = out.company.enrichment || {};
        out.company.enrichment.source = 'hunter';
      }
    } catch (e) {
      console.warn('Hunter call failed', e && e.message);
      // continue to enrichment fallbacks
    }
  }

  // 2) OG/meta glean from homepage
  try {
    const siteUrl = `https://${domainReq}`;
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

  // 3) Wikipedia fallback for description/logo
  try {
    const wikiQuery = out.company.name && out.company.name !== domainReq ? out.company.name : domainReq;
    const wiki = await fetchWikipediaHint(wikiQuery);
    if (wiki) {
      if (!out.company.description || (wiki.description && wiki.description.length > out.company.description.length + 20)) {
        out.company.description = wiki.description || out.company.description;
      }
      if (!out.company.logo && wiki.image) out.company.logo = wiki.image;
      out.company.enrichment = out.company.enrichment || {};
      out.company.enrichment.source = out.company.enrichment.source || 'wikipedia';
      if (wiki.url) out.company.enrichment.url = out.company.enrichment.url || wiki.url;
    }
  } catch (e) {
    // ignore
  }

  // 4) Clearbit logo fallback
  if (!out.company.logo) out.company.logo = clearbitLogo(domainReq);

  // Ensure numbers
  out.total = typeof out.total === 'number' ? out.total : (out.contacts && out.contacts.length) || 0;
  out.shown = typeof out.shown === 'number' ? out.shown : (out.contacts && out.contacts.length) || 0;

  // Save to in-memory cache
  cache.set(key, { ts: now, val: out });

  res.setHeader('x-cache', 'MISS');
  res.status(200).json(out);
}
