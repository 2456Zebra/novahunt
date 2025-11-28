// pages/api/find-company.js
// Server-side proxy to fetch company metadata (Clearbit optional) and contacts (Hunter).
// Added small in-memory TTL cache and more robust extraction of Hunter total count.
// Keep API keys in environment: HUNTER_API_KEY, CLEARBIT_KEY.

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const cache = new Map();

function now() { return Date.now(); }

function normalizeHunterEmail(e) {
  return {
    first_name: e.first_name || '',
    last_name: e.last_name || '',
    position: e.position || e.title || '',
    email: e.value || e.email || '',
    score: e.score || null,
    department: e.department || e.department_name || 'Other',
    source: e.sources || null,
    photo: e.avatar || e.picture || null
  };
}

function extractHunterTotal(hd) {
  // Try several common locations for the total count
  if (!hd || !hd.data) return 0;
  const d = hd.data;
  const possible = [
    d.total,
    (d.meta && d.meta.total),
    (d.meta && d.meta['results'] && d.meta['results'].total),
    (d.emails && d.emails.length),
    (d.meta && d.meta.emails && d.meta.emails.total)
  ];
  for (const v of possible) {
    if (typeof v === 'number' && v >= 0) return v;
    if (typeof v === 'string' && /^\d+$/.test(v)) return Number(v);
  }
  return (d.emails && d.emails.length) || 0;
}

export default async function handler(req, res) {
  const domain = (req.query.domain || '').toString().trim().toLowerCase();
  if (!domain) return res.status(400).json({ error: 'Missing domain query' });

  const cacheKey = `find:${domain}`;
  const cached = cache.get(cacheKey);
  if (cached && (now() - cached.ts) < CACHE_TTL_MS) {
    return res.status(200).json(cached.value);
  }

  const HUNTER_KEY = process.env.HUNTER_API_KEY;
  const CLEARBIT_KEY = process.env.CLEARBIT_KEY;

  const result = {
    domain,
    company: null,
    contacts: [],
    total: 0,
    shown: 0
  };

  // 1) Clearbit enrichment (optional)
  if (CLEARBIT_KEY) {
    try {
      const url = `https://company.clearbit.com/v2/companies/find?domain=${encodeURIComponent(domain)}`;
      const r = await fetch(url, { headers: { Authorization: `Bearer ${CLEARBIT_KEY}` } });
      if (r.ok) {
        const c = await r.json();
        result.company = {
          name: c.name || '',
          domain: c.domain || domain,
          logo: (c.logo && c.logo.length) ? c.logo : null,
          description: c.description || c.tagline || '',
          headquarters: c.location || (c.geo && [c.geo.city, c.geo.state].filter(Boolean).join(', ')) || '',
          ticker: c.ticker || '',
          sector: c.category && c.category.sector ? c.category.sector : '',
          industry: c.category && c.category.industry ? c.category.industry : '',
          metrics: c.metrics || {},
          raw: c
        };
      }
    } catch (err) {
      console.error('Clearbit fetch error', err?.message || err);
    }
  }

  // 2) Hunter domain-search for contacts
  if (HUNTER_KEY) {
    try {
      const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${HUNTER_KEY}`;
      const hr = await fetch(hunterUrl);
      if (hr.ok) {
        const hd = await hr.json();
        const emails = (hd && hd.data && hd.data.emails) ? hd.data.emails : [];
        const total = extractHunterTotal(hd) || emails.length || 0;

        // Limit contacts returned to first 10 for preview UX
        const shownEmails = emails.slice(0, 10);
        result.contacts = shownEmails.map(normalizeHunterEmail);
        result.total = total;
        result.shown = result.contacts.length;

        // Attempt to extract light metadata from Hunter organization info if needed
        if (!result.company && hd && hd.data && hd.data.organization) {
          const org = hd.data.organization;
          result.company = {
            name: org.name || domain,
            domain,
            logo: null,
            description: org.description || '',
            headquarters: org.address || '',
            raw: org
          };
        }
      } else {
        console.warn('Hunter returned non-OK', hr.status);
      }
    } catch (err) {
      console.error('Hunter fetch error', err?.message || err);
    }
  } else {
    return res.status(400).json({ error: 'Server missing HUNTER_API_KEY environment variable' });
  }

  // Final normalization: ensure company object exists
  if (!result.company) {
    result.company = {
      name: domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      domain,
      logo: null,
      description: '',
      headquarters: '',
      raw: {}
    };
  }

  // Provide a Clearbit logo fallback if explicit logo missing
  if (!result.company.logo) {
    result.company.logo = `https://logo.clearbit.com/${domain}?size=400`;
  }

  // Cache and return
  cache.set(cacheKey, { ts: now(), value: result });
  return res.status(200).json(result);
}
