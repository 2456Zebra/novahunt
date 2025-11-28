// pages/api/find-company.js
// Robust Hunter + Clearbit aggregator with small in-memory TTL cache and better total extraction.

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
  if (!hd) return 0;
  // hd may have different shapes — try many locations
  try {
    const d = hd.data || hd;
    const candidates = [
      d.total,
      d.count,
      d.meta && d.meta.total,
      d.meta && d.meta.count,
      d.meta && d.meta.results && d.meta.results.total,
      d.meta && d.meta.results_count,
      d.meta && d.meta.total_results,
      d.meta && d.meta.total_count,
      d.meta && d.meta.pagination && d.meta.pagination.total,
      d.emails && d.emails.length,
      (d.data && d.data.total),
      (d.meta && d.meta.emails && d.meta.emails.total)
    ];
    for (const v of candidates) {
      if (typeof v === 'number' && !Number.isNaN(v) && v >= 0) return v;
      if (typeof v === 'string' && /^\d+$/.test(v)) return Number(v);
    }
  } catch (e) {
    // ignore
  }
  return 0;
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
    shown: 0,
    debug: {}
  };

  // Try Clearbit (optional)
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
      } else {
        // record response code for debugging
        result.debug.clearbit_status = r.status;
      }
    } catch (err) {
      result.debug.clearbit_error = String(err?.message || err);
      console.error('Clearbit fetch error', err?.message || err);
    }
  }

  // Hunter domain-search
  if (HUNTER_KEY) {
    try {
      const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${HUNTER_KEY}`;
      const hr = await fetch(hunterUrl);
      const txt = await hr.text();
      let hd = null;
      try { hd = JSON.parse(txt); } catch { hd = null; }

      if (hr.ok && hd) {
        const emails = (hd && hd.data && hd.data.emails) ? hd.data.emails : [];
        const total = extractHunterTotal(hd) || emails.length || 0;

        const shownEmails = emails.slice(0, 10);
        result.contacts = shownEmails.map(normalizeHunterEmail);
        result.total = total;
        result.shown = result.contacts.length;

        // capture some debug info
        result.debug.hunter_raw = { emails_count: emails.length, has_meta: !!(hd.data && hd.data.meta) };

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
        result.debug.hunter_status = hr.status;
        result.debug.hunter_text = txt.slice(0, 2000);
        console.warn('Hunter returned non-OK', hr.status);
      }
    } catch (err) {
      result.debug.hunter_error = String(err?.message || err);
      console.error('Hunter fetch error', err?.message || err);
    }
  } else {
    return res.status(400).json({ error: 'Server missing HUNTER_API_KEY environment variable' });
  }

  // Ensure company fallback
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

  // logo fallback
  if (!result.company.logo) {
    result.company.logo = `https://logo.clearbit.com/${domain}?size=400`;
  }

  // store cache
  cache.set(cacheKey, { ts: now(), value: result });

  return res.status(200).json(result);
}
