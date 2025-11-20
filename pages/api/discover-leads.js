// pages/api/discover-leads.js
// Lightweight Discover Leads: uses an LLM (OpenAI) to produce candidate organizations,
// then optionally calls Hunter for domains present. Uses global fetch (no node-fetch).
// Requires OPENAI_API_KEY if you enable LLM; HUNTER_API_KEY is optional for email lookups.

const HUNTER_KEY = process.env.HUNTER_API_KEY || '';
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';

async function callLLMForCompanies(query, limit = 10) {
  if (!OPENAI_KEY) throw new Error('OPENAI_API_KEY missing');
  const prompt = `List the top ${limit} organizations that match this query: "${query}". For each item return JSON: {"name":"...","domain":"..."} . Return a JSON array only.`;
  const resp = await global.fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800
    })
  });
  if (!resp.ok) {
    const t = await resp.text().catch(()=>'');
    throw new Error(`LLM error ${resp.status}: ${t}`);
  }
  const j = await resp.json();
  const txt = j.choices && j.choices[0] && (j.choices[0].message?.content || j.choices[0].text) || '';
  try {
    const parsed = JSON.parse(txt);
    return parsed.slice(0, limit);
  } catch (e) {
    const lines = txt.split(/\n+/).filter(Boolean).slice(0, limit);
    return lines.map(l => ({ name: l.replace(/^\d+\.?\s*/, '').trim(), domain: '' }));
  }
}

async function hunterDomain(domain) {
  if (!HUNTER_KEY || !domain) return null;
  const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${encodeURIComponent(HUNTER_KEY)}`;
  const r = await global.fetch(url);
  if (!r.ok) return null;
  const j = await r.json();
  const emails = (j.data && j.data.emails) ? j.data.emails.slice(0, 5).map(e => ({
    email: e.value, name: [e.first_name, e.last_name].filter(Boolean).join(' '), title: e.position || '', confidence: e.confidence ? e.confidence/100 : 0
  })) : [];
  return emails;
}

export default async function handler(req, res) {
  try {
    const q = String((req.query && req.query.q) || '').trim();
    const limit = Math.min(20, parseInt(req.query.limit || '10', 10));
    if (!q) return res.status(400).json({ ok: false, error: 'Missing q param' });

    if (!OPENAI_KEY) {
      // If LLM key missing, return an error (or you could return a helpful message)
      return res.status(500).json({ ok: false, error: 'OPENAI_API_KEY missing in env' });
    }

    const companies = await callLLMForCompanies(q, limit);
    const results = [];
    for (const c of companies) {
      const domain = (c.domain || c.website || '').replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] || '';
      let emails = [];
      if (domain) {
        try { emails = await hunterDomain(domain); } catch (e) { emails = []; }
      }
      results.push({ company: c.name, domain: domain || '', leads: emails || [] });
    }

    return res.status(200).json({ ok: true, poweredBy: 'Copilot', query: q, results });
  } catch (err) {
    console.error('discover-leads error', err && err.message);
    return res.status(500).json({ ok: false, error: 'Discover failed' });
  }
}
