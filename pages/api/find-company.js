// pages/api/find-company.js
// Server-side proxy to fetch company metadata (Clearbit) and contacts (Hunter domain-search).
// Uses global fetch (Node >= 18). Keep API keys in environment: HUNTER_API_KEY, CLEARBIT_KEY (optional).

function normalizeHunterEmail(e) {
  // Hunter v2 domain-search email object → simplified contact model
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

export default async function handler(req, res) {
  const domain = (req.query.domain || '').toString().trim().toLowerCase();
  if (!domain) return res.status(400).json({ error: 'Missing domain query' });

  const HUNTER_KEY = process.env.HUNTER_API_KEY;
  const CLEARBIT_KEY = process.env.CLEARBIT_KEY;

  const result = {
    domain,
    company: null,
    contacts: [],
    total: 0,
    shown: 0
  };

  // 1) Try Clearbit Company enrichment (optional)
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
          city: c.geo && c.geo.city ? c.geo.city : '',
          state: c.geo && c.geo.state ? c.geo.state : '',
          country: c.geo && c.geo.country ? c.geo.country : '',
          headquarters: (c.location || (c.geo && [c.geo.city, c.geo.state].filter(Boolean).join(', ')) || ''),
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

  // 2) Hunter domain-search for contacts (requires HUNTER_API_KEY)
  if (HUNTER_KEY) {
    try {
      const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${HUNTER_KEY}`;
      const hr = await fetch(hunterUrl);
      if (hr.ok) {
        const hd = await hr.json();
        // Hunter payload path: hd.data.emails (array); try to get total if provided
        const emails = (hd && hd.data && hd.data.emails) ? hd.data.emails : [];
        // Many Hunter responses include a 'total' or 'meta.total' — try common spots
        const total = (hd && hd.data && (hd.data.total || hd.data.meta && hd.data.meta.total)) || emails.length || 0;

        // Limit contacts returned to the first 10 for the "Showing X of Y" UX
        const shownEmails = emails.slice(0, 10);

        result.contacts = shownEmails.map(normalizeHunterEmail);
        result.total = total;
        result.shown = result.contacts.length;

        // If no company metadata yet, attempt to extract light metadata from Hunter
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
    // If no Hunter key present, return helpful message
    return res.status(400).json({ error: 'Server missing HUNTER_API_KEY environment variable' });
  }

  // 3) Final normalization: ensure company object exists and logo fallback
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

  // Provide a lightweight logo fallback using Clearbit logo service if we don't have an explicit logo
  if (!result.company.logo) {
    // Clearbit logo endpoint is unauthenticated for logos (simple fallback)
    result.company.logo = `https://logo.clearbit.com/${domain}?size=400`;
  }

  return res.status(200).json(result);
}
