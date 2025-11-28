// pages/api/enrich-company.js
// Enrichment pipeline (free): prefer Wikidata + Wikipedia for structured facts and friendly narrative.
// Fallback: Google KG (if configured), then OG/meta scraping.
// Produces: { domain, description, image, url, source, facts, narrative }
// Uses small in-memory TTL cache. Suitable for preview; switch to Redis for production.

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const cache = new Map();

function now() { return Date.now(); }

// Helper: fetch root HTML (OG/meta)
async function fetchRootHtml(domain) {
  const urls = [`https://${domain}`, `https://www.${domain}`, `http://${domain}`, `http://www.${domain}`];
  for (const u of urls) {
    try {
      const r = await fetch(u, { method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NovaHunt/1.0)' }, redirect:'follow' });
      if (r.ok) {
        const text = await r.text();
        return { html: text, url: r.url || u };
      }
    } catch (e) {
      // ignore and try next
    }
  }
  return null;
}

function extractMetaField(html, names) {
  if (!html) return '';
  for (const n of names) {
    const re = new RegExp(`<meta[^>]+(?:property|name)=['"]${n}['"][^>]*content=['"]([^'"]+)['"]`, 'i');
    const m = re.exec(html);
    if (m && m[1]) return m[1].trim();
  }
  // try <title>
  if (names.includes('og:title') || names.includes('title')) {
    const t = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
    if (t && t[1]) return t[1].trim();
  }
  return '';
}

// Query Wikidata using Wikidata's search API and then get entity claims
async function tryWikidata(domain, nameCandidates=[]) {
  // Try queries: derived name candidates (e.g., "Coca-Cola")
  for (const q of nameCandidates) {
    if (!q || q.trim().length < 2) continue;
    try {
      const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(q)}&language=en&format=json&limit=5`;
      const r = await fetch(searchUrl);
      if (!r.ok) continue;
      const j = await r.json();
      const hits = j && j.search ? j.search : [];
      if (!hits || hits.length === 0) continue;
      // prefer the first match that is an organization/company
      for (const h of hits) {
        // Fetch entity data
        const id = h.id;
        const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${id}.json`;
        try {
          const er = await fetch(entityUrl);
          if (!er.ok) continue;
          const ej = await er.json();
          const entity = ej && ej.entities && ej.entities[id];
          if (!entity) continue;
          const claims = entity.claims || {};
          // Map common properties:
          // P571 = inception (founding date)
          // P112 = founded by
          // P214 = VIAF (not required)
          // P17 = country (country of origin)
          // P31 = instance of
          // P749 = parent organization
          // P159 = headquarters location
          // P2524 / P1128 etc. (varies)
          const getClaimValue = (pid) => {
            try {
              const c = claims[pid];
              if (!c || !c[0]) return null;
              const v = c[0].mainsnak && c[0].mainsnak.datavalue && c[0].mainsnak.datavalue.value;
              if (!v) return null;
              // for time values
              if (v.time) return v.time.replace(/^ \+?/, '').split('T')[0];
              if (v.id) return v.id;
              if (v['time']) return v['time'];
              if (v['numeric-id']) return v['numeric-id'];
              return v;
            } catch { return null; }
          };

          const inception = getClaimValue('P571');
          const industryIds = (claims['P452'] || []).map(x => x.mainsnak.datavalue.value.id).filter(Boolean); // industry
          const headquarters = getClaimValue('P159') || getClaimValue('P276');
          const official_website = (claims['P856'] && claims['P856'][0] && claims['P856'][0].mainsnak.datavalue.value) || null;
          const employees = getClaimValue('P1128') || getClaimValue('P1082'); // employees / population
          const ticker = getClaimValue('P249') || getClaimValue('P414'); // ISIN/ticker guesses
          // Try to resolve some ids (like industries) to labels
          const labels = entity.labels || {};
          const enLabel = (labels.en && labels.en.value) || h.label || q;
          // Build a facts object (we keep raw claims too)
          const facts = {
            wikidata_id: id,
            name: enLabel,
            inception,
            headquarters,
            official_website,
            employees,
            ticker,
            raw_claims: Object.keys(claims).slice(0,10) // keep keys for debug
          };
          return { source: 'wikidata', facts, name: enLabel };
        } catch { /* next hit */ }
      }
    } catch (err) {
      // ignore and try next candidate
    }
  }
  return null;
}

// Try wikipedia summary for query
async function tryWikipediaSummary(query) {
  if (!query || query.trim().length < 2) return null;
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`;
    const r = await fetch(searchUrl);
    if (!r.ok) return null;
    const j = await r.json();
    const hits = j && j.query && j.query.search ? j.query.search : [];
    if (!hits || hits.length === 0) return null;
    const title = hits[0].title;
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const s = await fetch(summaryUrl);
    if (!s.ok) return null;
    const sj = await s.json();
    const description = sj.extract || sj.description || '';
    const image = sj.thumbnail && sj.thumbnail.source ? sj.thumbnail.source : null;
    const url = sj.content_urls && sj.content_urls.desktop && sj.content_urls.desktop.page ? sj.content_urls.desktop.page : null;
    if (description || image) return { description, image, url, source: 'wikipedia' };
  } catch (err) {
    // ignore
  }
  return null;
}

// Simple sanitizer/paraphraser (lightweight): shortens and avoids raw marketing copy
function paraphraseShort(description) {
  if (!description) return '';
  // remove excessive trademarks or CTAs heuristically
  let t = description.replace(/\b(©|®|™)\b/g, '');
  // remove "Shop ...", "Buy ..." lines often in marketing text
  t = t.replace(/(Shop|Buy)[\s\S]{0,100}$/i, '');
  // trim and shorten to 2 sentences max
  const sentences = t.split(/(?<=[.?!])\s+/);
  const take = sentences.slice(0, 2).join(' ').trim();
  return take.length ? take : t.slice(0, 240);
}

// Compose a conversational narrative from facts + optional summary
function composeNarrative({ name, facts = {}, summary = '' }) {
  // Try to build from structured facts first
  const parts = [];
  if (facts.inception) {
    const year = (typeof facts.inception === 'string') ? (facts.inception.slice(0,4)) : null;
    if (year) parts.push(`${name} was founded in ${year}`);
  }
  if (facts.industry || facts.sector) {
    parts.push(`${name} operates in ${facts.industry || facts.sector}`);
  }
  if (facts.headquarters) {
    parts.push(`and is headquartered in ${facts.headquarters}`);
  }
  // join first phrase
  let lead = parts.length ? parts.join(' ') + '.' : '';
  if (!lead && summary) {
    // fallback to brief paraphrased summary
    lead = paraphraseShort(summary);
  }
  // add one more sentence from summary if present and not duplicative
  let extra = '';
  if (summary) {
    const s = paraphraseShort(summary);
    if (s && s !== lead) extra = s;
  }
  const narrative = [lead, extra].filter(Boolean).join(' ');
  // final safety: if narrative empty, produce canned fallback
  if (!narrative || narrative.trim().length < 20) return `${name} is an organization you can learn more about by visiting their website.`;
  return narrative;
}

export default async function handler(req, res) {
  const domain = (req.query.domain || '').toString().trim().toLowerCase();
  if (!domain) return res.status(400).json({ error: 'Missing domain query' });

  const cacheKey = `enrich2:${domain}`;
  const cached = cache.get(cacheKey);
  if (cached && (now() - cached.ts) < CACHE_TTL_MS) {
    return res.status(200).json(cached.value);
  }

  // 1) fetch root HTML quickly to get og:title and og:description
  const root = await fetchRootHtml(domain);
  const ogTitle = root && root.html ? extractMetaField(root.html, ['og:title', 'title', 'twitter:title']) : '';
  const ogDescription = root && root.html ? extractMetaField(root.html, ['og:description','description','twitter:description']) : '';
  const ogImage = root && root.html ? extractMetaField(root.html, ['og:image','twitter:image','image']) : null;

  // Build candidate queries for Wikidata / Wikipedia:
  const domainParts = domain.split('.');
  const base = domainParts.slice(0, domainParts.length - 1).join(' ');
  const inferredName = base.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const alt1 = domainParts[0].replace(/-/g, ' ');
  const alt2 = domain.replace(/\.(com|net|org|co|io|ai)$/, '').replace(/-/g, ' ');
  const candidates = [ogTitle, inferredName, alt1, alt2].filter(Boolean);

  // 2) Try Wikidata for structured facts
  let wikidataResult = null;
  try {
    wikidataResult = await tryWikidata(domain, candidates);
  } catch (err) {
    // ignore
  }

  // 3) Try Wikipedia summary (prefer using the best candidate, ogTitle first)
  let wikiSummary = null;
  try {
    for (const q of candidates) {
      if (!q) continue;
      const w = await tryWikipediaSummary(q);
      if (w) { wikiSummary = w; break; }
    }
  } catch (err) { /* ignore */ }

  // 4) Build facts object from wikidataResult and root og info
  const facts = wikidataResult ? (wikidataResult.facts || {}) : {};
  if (!facts.official_website && root && root.url) facts.official_website = root.url;
  if (!facts.image && ogImage) facts.image = ogImage;

  // 5) Compose narrative - prefer Wikipedia summary text (rewritten) and structured facts
  const name = wikidataResult?.name || (wikiSummary && wikiSummary.title) || (candidates[0] || domainParts[0] || domain);
  const summaryText = wikiSummary ? wikiSummary.description || wikiSummary.extract || wikiSummary.summary || '' : (ogDescription || '');
  const narrative = composeNarrative({ name, facts, summary: summaryText });

  const out = {
    domain,
    name,
    description: summaryText ? paraphraseShort(summaryText) : '', // short sanitized description
    narrative, // conversational longer paragraph we've composed
    image: facts.image || (wikiSummary && wikiSummary.image) || ogImage || null,
    url: facts.official_website || (wikiSummary && wikiSummary.url) || (root && root.url) || null,
    source: wikiSummary ? 'wikipedia' : (wikidataResult ? 'wikidata' : (ogDescription ? 'og' : 'none')),
    facts
  };

  cache.set(cacheKey, { ts: now(), value: out });
  return res.status(200).json(out);
}
