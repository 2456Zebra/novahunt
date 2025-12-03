// Minimal, robust /api/find-company that directly calls Hunter and returns mapped contacts.
// Replace your existing pages/api/find-company.js with this file and redeploy.
// This version intentionally omits in-memory caching to ensure you see immediate results during testing.
// After you confirm it works, we can re-add caching safely.

export default async function handler(req, res) {
  const domain = (req.query.domain || '').toString().trim().toLowerCase();
  if (!domain) {
    res.status(400).json({ error: 'domain required' });
    return;
  }

  const HUNTER_API_KEY = process.env.HUNTER_API_KEY;
  const out = {
    company: { name: domain, domain, description: null, logo: null, enrichment: null },
    contacts: [],
    total: 0,
    shown: 0,
    hunter_raw: null
  };

  if (!HUNTER_API_KEY) {
    res.status(500).json({ error: 'HUNTER_API_KEY not set', out });
    return;
  }

  try {
    // Call Hunter domain-search (sample up to 100)
    const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&limit=100&api_key=${encodeURIComponent(HUNTER_API_KEY)}`;
    const r = await fetch(hunterUrl);
    const txt = await r.text();
    let json = null;
    try { json = txt ? JSON.parse(txt) : null; } catch (e) { json = null; }

    out.hunter_raw = { status: r.status, ok: r.ok, json, text: txt };

    const data = json && json.data ? json.data : null;
    if (data) {
      // Extract totals from common places
      let total = null;
      if (typeof data.total === 'number') total = data.total;
      if (total === null && data.metrics && typeof data.metrics.emails === 'number') total = data.metrics.emails;
      if (total === null && json && json.meta && typeof json.meta.results === 'number') total = json.meta.results;
      if (total === null && Array.isArray(data.emails)) total = data.emails.length;

      out.total = total || 0;

      if (Array.isArray(data.emails) && data.emails.length) {
        out.contacts = data.emails.map(e => ({
          first_name: e.first_name || '',
          last_name: e.last_name || '',
          email: e.value || e.email || '',
          position: e.position || e.position_raw || '',
          score: e.confidence || null,
          department: e.department || '',
          linkedin: e.linkedin || null
        })).filter(c => c.email && c.email.includes('@'));

        out.shown = out.contacts.length;
        if (!out.total) out.total = out.shown;
      }

      if (data.organization) out.company.name = data.organization;
      if (data.domain) out.company.domain = data.domain;
    }
  } catch (err) {
    console.error('hunter error', err && err.message);
    // fall through — we still return out (possibly empty)
  }

  res.setHeader('Cache-Control', 'no-store'); // avoid any intermediary caching while debugging
  res.status(200).json(out);
}
