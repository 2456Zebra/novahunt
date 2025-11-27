// pages/api/find-company.js
// Server-side proxy to fetch company metadata (Clearbit) and contacts (Hunter domain-search).
// Use the global fetch available in Node >= 18 (no node-fetch import).
// Keep API keys in environment: HUNTER_API_KEY, CLEARBIT_KEY (optional).

function normalizeHunterEmail(e) {
  // Hunter v2 domain-search email object → simplified contact model
  return {
    first_name: e.first_name || '',
    last_name: e.last_name || '',
    position: e.position || e.title || '',
    email: e.value || e.email || '',
    score: e.score || null,
    // Hunter doesn't always provide department; leave blank if not present
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
    contacts: []
  };

  // 1) Try Clearbit Company enrichment (optional)
  if (CLEARBIT_KEY) {
    try {
      const url = `https://company.clearbit.com/v2/companies/find?domain=${encodeURIComponent(domain)}`;
      const r = await fetch(url, { headers: { Authorization: `Bearer ${CLEARBIT_KEY}` } });
      if (r.ok) {
        const c = await r.json();
        // Map to our company shape
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
      // continue, fallback to Hunter-derived metadata
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
        // Hunter payload path: hd.data.emails (array)
        const emails = (hd && hd.data && hd.data.emails) ? hd.data.emails : [];
        result.contacts = emails.map(normalizeHunterEmail);
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

  // 3) Final normalization: ensure company object exists
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

  return res.status(200).json(result);
}
