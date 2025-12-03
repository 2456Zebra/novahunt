// Serverless /api/find-company (updated)
// - Integrates Hunter domain-search when HUNTER_API_KEY is provided.
// - Requests up to 100 emails from Hunter to surface more rows for testing.
// - Robustly extracts Hunter's authoritative total from several possible response fields.
// - Falls back to scraping OpenGraph/meta for description/logo and uses Clearbit logo service.
// - Uses Wikipedia search+summary as an additional free fallback for company description and image.
// - Includes a simple in-memory cache (ttl 12h) to avoid hitting Hunter on every request.
//
// Note: Add your Hunter API key to environment as HUNTER_API_KEY.

const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const cache = new Map();

function cacheKey(domain) {
  return `find:${domain}`;
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  const txt = await res.text();
  try { return JSON.parse(txt); } catch (e) { return null; }
}

function extractMeta(html) {
  try {
    const lower = html;
    const ogDesc = lower.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const ogImg = lower.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const metaDesc = lower.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const ogTitle = lower.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i)
      || lower.match(/<title[^>]*>([^<]+)<\/title>/i);

    const description = (ogDesc && ogDesc[1]) || (metaDesc && metaDesc[1]) || '';
    const image = (ogImg && ogImg[1]) || '';
    const title = (ogTitle && ogTitle[1]) || '';
    return { description: description.trim(), image: image.trim(), title: title.trim() };
  } catch (e) {
    return { description: '', image: '', title: '' };
  }
}

function clearbitLogo(domain) {
  if (!domain) return null;
  return `https://logo.clearbit.com/${domain}`;
}

// Wikipedia fallback: search for company name / domain, then fetch summary
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

  // Base response
  const out = {
    company: { name: domainReq, domain: domainReq, description: null, logo: null, enrichment: null },
    contacts: [],
    total: null,
    shown: 0,
  };

  const HUNTER_API_KEY = process.env.HUNTER_API_KEY || null;

  // 1) Hunter integration (if key present)
  if (HUNTER_API_KEY) {
    try {
      // Request up to 100 emails so we surface a larger sample during testing.
      const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domainReq)}&limit=100&api_key=${encodeURIComponent(HUNTER_API_KEY)}`;
      const hunter = await fetchJson(hunterUrl);
      const data = hunter && hunter.data ? hunter.data : null;

      if (data) {
        // Attempt to extract an authoritative total from various possible fields.
        // Hunter responses differ by plan/version; check common locations.
        let total = null;

        // common: data.total (number)
        if (typeof data.total === 'number') total = data.total;

        // some shapes: data.metrics.emails
        if (total === null && data.metrics && typeof data.metrics.emails === 'number') total = data.metrics.emails;

        // some responses may include meta/total
        if (total === null && hunter && hunter.meta && typeof hunter.meta.total === 'number') total = hunter.meta.total;

        // fallback: if data.emails is an array and Hunter didn't give a total, we can use server-side reported length
        if (total === null && Array.isArray(data.emails) && data.emails.length) total = data.emails.length;

        if (total !== null) out.total = total;

        // Map emails to contacts (we limit to what Hunter returned in this request)
        if (Array.isArray(data.emails)) {
          out.contacts = data.emails.map((e) => ({
            first_name: e.first_name || '',
            last_name: e.last_name || '',
            email: e.value || e.email || '',
            position: e.position || e.position || '',
            score: e.confidence || e.score || null,
            department: e.department || '',
          }));
          out.shown = out.contacts.length;
          // if total not set yet, set to shown (temporary)
          if (out.total === null) out.total = out.shown;
        }

        // Hunter may include organization/name
        if (data.organization) out.company.name = data.organization;
        if (data.domain) out.company.domain = data.domain;

        // record enrichment source
        out.company.enrichment = out.company.enrichment || {};
        out.company.enrichment.source = 'hunter';
      }
    } catch (e) {
      console.warn('Hunter integration failed:', e && e.message);
      // proceed to OG/Wikipedia fallback
    }
  }

  // 2) Fetch company homepage for OG/meta tags (description + image)
  try {
    const siteUrl = `https://${domainReq}`;
    const r = await fetch(siteUrl, { redirect: 'follow' }).catch(() => null);
    if (r && r.ok) {
      const html = await r.text().catch(() => '');
      if (html) {
        const meta = extractMeta(html);
        if (meta.description) out.company.description = meta.description;
        if (meta.image) out.company.logo = meta.image;
        out.company.enrichment = out.company.enrichment || {};
        out.company.enrichment.url = siteUrl;
        out.company.enrichment.source = out.company.enrichment.source || 'og';
      }
    }
  } catch (e) {
    // ignore
  }

  // 3) Wikipedia fallback for description/logo if none found yet
  if ((!out.company.description || out.company.description.length < 30) || !out.company.logo) {
    try {
      const wikiQuery = out.company.name && out.company.name !== domainReq ? out.company.name : domainReq;
      const wiki = await fetchWikipediaHint(wikiQuery);
      if (wiki) {
        if (!out.company.description || out.company.description.length < 30) {
          out.company.description = wiki.description || out.company.description;
        }
        if (!out.company.logo && wiki.image) {
          out.company.logo = wiki.image;
        }
        out.company.enrichment = out.company.enrichment || {};
        out.company.enrichment.source = out.company.enrichment.source || 'wikipedia';
        if (wiki.url) out.company.enrichment.url = out.company.enrichment.url || wiki.url;
      }
    } catch (e) {
      // ignore
    }
  }

  // 4) Clearbit logo fallback if no logo found yet
  if (!out.company.logo) {
    out.company.logo = clearbitLogo(domainReq);
  }

  // 5) Ensure shown/total are set
  out.total = (typeof out.total === 'number') ? out.total : (out.contacts && out.contacts.length) || 0;
  out.shown = (typeof out.shown === 'number') ? out.shown : (out.contacts && out.contacts.length) || 0;

  // 6) Save to cache and respond
  cache.set(key, { ts: now, val: out });
  res.setHeader('x-cache', 'MISS');
  res.status(200).json(out);
}
