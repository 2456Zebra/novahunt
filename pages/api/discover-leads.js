// Lightweight Discover Leads (LLM -> list of companies/domains)
// - Requires OPENAI_API_KEY to be set to enable LLM discovery.
// - Uses a low-cost model by default (gpt-3.5-turbo). Change via LLM_MODEL env var.
// - Caches results per query for 5 minutes.
// - Applies a simple in-memory rate limit per session/IP (demo only).
//
// Note: In production, replace in-memory caches and rate-limits with Redis / persistent store.

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL || 'gpt-3.5-turbo';
const CACHE = new Map();
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes
const RATE_LIMIT = { windowMs: 1000 * 60 * 60 * 24, max: 5 }; // 5 searches per 24h per session/IP
const RATE = new Map(); // simple in-memory counts

function cacheSet(key, value) {
  CACHE.set(key, { value, t: Date.now() });
}
function cacheGet(key) {
  const rec = CACHE.get(key);
  if (!rec) return null;
  if (Date.now() - rec.t > CACHE_TTL_MS) { CACHE.delete(key); return null; }
  return rec.value;
}

function rateKey(req) {
  // Prefer session token if available, otherwise use IP
  const cookie = req.headers.cookie || '';
  const m = cookie.match(/nh_session=([^;]+)/);
  if (m && m[1]) return `sess:${m[1]}`;
  return `ip:${req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'}`;
}

function enforceRateLimit(req) {
  const k = rateKey(req);
  const rec = RATE.get(k) || { count: 0, t: Date.now() };
  const now = Date.now();
  if (now - rec.t > RATE_LIMIT.windowMs) {
    // reset window
    rec.count = 0;
    rec.t = now;
  }
  if (rec.count >= RATE_LIMIT.max) {
    return false;
  }
  rec.count += 1;
  RATE.set(k, rec);
  return true;
}

async function callOpenAIForCompanies(query, limit = 10) {
  // Build a prompt asking for a JSON array of objects {name, domain}
  const prompt = `Provide a JSON array (no extra text) of up to ${limit} organizations matching this query: "${query}".
For each entry return {"name":"...","domain":"..."} where domain is a best-effort domain (e.g., example.com) or an empty string if unknown. Return valid JSON only.`;

  const resp = await global.fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.2
    })
  });

  if (!resp.ok) {
    const text = await resp.text().catch(()=>'');
    throw new Error(`LLM request failed ${resp.status}: ${text}`);
  }

  const j = await resp.json();
  const content = j.choices && j.choices[0] && (j.choices[0].message?.content || j.choices[0].text) || '';
  // Try to parse JSON
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed.slice(0, limit);
  } catch (e) {
    // fallback: try to extract JSON block
    const m = content.match(/\[.*\]/s);
    if (m) {
      try {
        const parsed = JSON.parse(m[0]);
        if (Array.isArray(parsed)) return parsed.slice(0, limit);
      } catch (err) {}
    }
    // ultimate fallback: parse plain lines
    const lines = content.split(/\n+/).filter(Boolean).slice(0, limit);
    return lines.map(l => ({ name: l.replace(/^\d+\.?\s*/, '').trim(), domain: '' }));
  }

  return [];
}

export default async function handler(req, res) {
  try {
    const q = String((req.query && req.query.q) || '').trim();
    const limit = Math.min(20, parseInt(req.query.limit || '10', 10));
    if (!q) return res.status(400).json({ ok: false, error: 'Missing q param' });

    // If OPENAI not configured, return helpful message so we don't bill
    if (!OPENAI_KEY) {
      return res.status(200).json({ ok: false, error: 'Discover disabled (OPENAI_API_KEY not set). Contact sales to enable or see Plans.' });
    }

    // Rate limit per session/IP (demo)
    const allowed = enforceRateLimit(req);
    if (!allowed) return res.status(429).json({ ok: false, error: 'Rate limit exceeded for Discover. Upgrade for more searches.' });

    const cacheKey = `discover:${q}:${limit}`;
    const cached = cacheGet(cacheKey);
    if (cached) return res.status(200).json({ ok: true, poweredBy: 'Copilot', query: q, results: cached });

    const companies = await callOpenAIForCompanies(q, limit);
    // normalize entries to { name, domain }
    const normalized = (companies || []).map(c => ({
      name: (c.name || c.company || c.title || String(c)).toString(),
      domain: (c.domain || c.website || '').toString().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] || ''
    })).slice(0, limit);

    cacheSet(cacheKey, normalized);
    return res.status(200).json({ ok: true, poweredBy: 'Copilot', query: q, results: normalized });
  } catch (err) {
    console.error('discover-leads error', err && err.message);
    return res.status(500).json({ ok: false, error: 'Discover failed' });
  }
}
