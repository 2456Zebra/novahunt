// pages/api/find-company.js
// No-cache handler for debugging: always calls Hunter, maps data.emails -> contacts,
// returns hunter_raw for debugging, forces Cache-Control: no-store.
//
// IMPORTANT: copy/paste this file to pages/api/find-company.js and redeploy.
// Make sure HUNTER_API_KEY is set in Production env.

export default async function handler(req, res) {
  const domain = (req.query.domain || '').toString().trim().toLowerCase();
  if (!domain) {
    res.status(400).json({ error: 'domain required' });
    return;
  }

  const HUNTER_API_KEY = process.env.HUNTER_API_KEY;
  if (!HUNTER_API_KEY) {
    res.status(500).json({ error: 'HUNTER_API_KEY not set in environment' });
    return;
  }

  const out = {
    company: { name: domain, domain, description: null, logo: null, enrichment: null },
    contacts: [],
    total: 0,
    shown: 0,
    hunter_raw: null
  };

  try {
    // Call Hunter domain-search (limit=100)
    const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&limit=100&api_key=${encodeURIComponent(HUNTER_API_KEY)}`;
    const hunterRes = await fetch(hunterUrl);
    const hunterText = await hunterRes.text().catch(() => null);
    let hunterJson = null;
    try { hunterJson = hunterText ? JSON.parse(hunterText) : null; } catch (e) { hunterJson = null; }

    out.hunter_raw = { status: hunterRes.status, ok: hunterRes.ok, json: hunterJson, text: hunterText };

    const data = hunterJson && hunterJson.data ? hunterJson.data : null;
    if (data) {
      // total detection from common fields
      let total = null;
      if (typeof data.total === 'number') total = data.total;
      if (total === null && data.metrics && typeof data.metrics.emails === 'number') total = data.metrics.emails;
      if (total === null && hunterJson && hunterJson.meta && typeof hunterJson.meta.results === 'number') total = hunterJson.meta.results;
      if (total === null && Array.isArray(data.emails)) total = data.emails.length;
      if (total !== null) out.total = total;

      if (Array.isArray(data.emails) && data.emails.length) {
        out.contacts = data.emails.map(e => ({
          first_name: e.first_name || '',
          last_name: e.last_name || '',
          email: e.value || e.email || '',
          position: e.position || e.position_raw || '',
          score: e.confidence || null,
          department: e.department || '',
          linkedin: e.linkedin || null,
          sources: e.sources || null
        })).filter(c => c.email && c.email.includes('@'));

        out.shown = out.contacts.length;
        if (!out.total) out.total = out.shown;
      }

      if (data.organization) out.company.name = data.organization;
      if (data.domain) out.company.domain = data.domain;
      out.company.enrichment = out.company.enrichment || {};
      out.company.enrichment.source = out.company.enrichment.source || 'hunter';
    }
  } catch (err) {
    console.error('Hunter fetch error:', err && err.message);
  }

  // Best-effort OG/meta extraction (for description / logo)
  try {
    const r = await fetch(`https://${domain}`, { redirect: 'follow' }).catch(() => null);
    if (r && r.ok) {
      const html = await r.text().catch(() => '');
      if (html) {
        const descMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i)
          || html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
        const imgMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
        if (descMatch && descMatch[1]) out.company.description = out.company.description || String(descMatch[1]).trim();
        if (imgMatch && imgMatch[1]) out.company.logo = out.company.logo || String(imgMatch[1]).trim();
      }
    }
  } catch (e) { /* ignore */ }

  // Clearbit fallback
  if (!out.company.logo) out.company.logo = `https://logo.clearbit.com/${domain}`;

  // Force no caching for debugging
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.status(200).json(out);
}
