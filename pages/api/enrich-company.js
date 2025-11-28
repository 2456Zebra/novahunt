// pages/api/enrich-company.js
// Enrichment pipeline (free): prefer Wikidata + Wikipedia (longer extract) for structured facts and a friendly narrative.
// Fallback: OpenCorporates (facts), then OG/meta scraping.
// Produces: { domain, name, description (short), narrative (composed), image, url, source, facts }
// Simple in-memory TTL cache for preview.

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map();

function now() { return Date.now(); }

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
      // try next
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
  if (names.includes('og:title') || names.includes('title')) {
    const t = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
    if (t && t[1]) return t[1].trim();
  }
  return '';
}

async function tryWikidata(domain, nameCandidates=[]) {
  for (const q of nameCandidates) {
    if (!q || q.trim().length < 2) continue;
    try {
      const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(q)}&language=en&format=json&limit=5`;
      const r = await fetch(searchUrl);
      if (!r.ok) continue;
      const j = await r.json();
      const hits = j && j.search ? j.search : [];
      if (!hits || hits.length === 0) continue;
      for (const h of hits) {
        const id = h.id;
        const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${id}.json`;
        try {
          const er = await fetch(entityUrl);
          if (!er.ok) continue;
          const ej = await er.json();
          const entity = ej && ej.entities && ej.entities[id];
          if (!entity) continue;
          const claims = entity.claims || {};
          const getClaimValue = (pid) => {
            try {
              const c = claims[pid];
              if (!c || !c[0]) return null;
              const v = c[0].mainsnak && c[0].mainsnak.datavalue && c[0].mainsnak.datavalue.value;
              if (!v) return null;
              if (v.time) return v.time.replace(/^[+]/,'').split('T')[0];
              if (v.id) return v.id;
              return v;
            } catch { return null; }
          };

          const inception = getClaimValue('P571');
          const headquarters = getClaimValue('P159') || getClaimValue('P276');
          const official_website = (claims['P856'] && claims['P856'][0] && claims['P856'][0].mainsnak.datavalue.value) || null;
          const employees = getClaimValue('P1128') || getClaimValue('P1082');
          const ticker = getClaimValue('P249') || getClaimValue('P414');

          const labels = entity.labels || {};
          const enLabel = (labels.en && labels.en.value) || h.label || q;

          const facts = {
            wikidata_id: id,
            name: enLabel,
            inception,
            headquarters,
            official_website,
            employees,
            ticker,
            raw_claims: Object.keys(claims).slice(0,10)
          };
          return { source: 'wikidata', facts, name: enLabel };
        } catch (e) {
          // continue
        }
      }
    } catch (err) {
      // ignore
    }
  }
  return null;
}

async function tryWikipediaLongExtract(title) {
  if (!title) return null;
  try {
    // Use action=query + prop=extracts + explaintext + exintro + exchars to get a longer intro
    const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&exintro=1&exchars=1500&titles=${encodeURIComponent(title)}&format=json&origin=*`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = await r.json();
    const pages = j && j.query && j.query.pages ? j.query.pages : null;
    if (!pages) return null;
    const keys = Object.keys(pages);
    if (!keys || keys.length === 0) return null;
    const p = pages[keys[0]];
    const extract = p && p.extract ? p.extract.trim() : '';
    // thumbnail fetch (if exists)
    let image = null;
    if (p && p.thumbnail && p.thumbnail.source) image = p.thumbnail.source;
    const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;
    if (extract || image) return { description: extract, image, url: pageUrl, source: 'wikipedia', title };
  } catch (err) {
    // ignore
  }
  return null;
}

function paraphraseShort(description) {
  if (!description) return '';
  let t = description.replace(/\b(©|®|™)\b/g, '');
  t = t.replace(/(Shop|Buy|Order)[\s\S]{0,200}$/i, '');
  const sentences = t.split(/(?<=[.?!])\s+/);
  const take = sentences.slice(0, 3).join(' ').trim();
  return take.length ? take : t.slice(0, 400);
}

function composeNarrative({ name, facts = {}, summary = '' }) {
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
  let lead = parts.length ? parts.join(' ') + '.' : '';
  if (!lead && summary) {
    lead = paraphraseShort(summary);
  }
  let extra = '';
  if (summary) {
    const s = paraphraseShort(summary);
    if (s && s !== lead) extra = s;
  }
  const narrative = [lead, extra].filter(Boolean).join(' ');
  if (!narrative || narrative.trim().length < 30) return `${name} is an organization you can learn more about by visiting their website.`;
  return narrative;
}

async function tryOpenCorporates(query) {
  try {
    const url = `https://api.opencorporates.com/v0.4/companies/search?q=${encodeURIComponent(query)}`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = await r.json();
    const results = j && j.results && j.results.companies ? j.results.companies : [];
    if (!results || results.length === 0) return null;
    const c = results[0].company;
    const facts = {
      name: c && c.name,
      jurisdiction_code: c && c.jurisdiction_code,
      company_number: c && c.company_number,
      incorporation_date: c && c.incorporation_date,
      source: 'opencorporates',
      raw: { registered_address: c.registered_address }
    };
    return { source: 'opencorporates', facts };
  } catch (err) {
    return null;
  }
}

export default async function handler(req, res) {
  const domain = (req.query.domain || '').toString().trim().toLowerCase();
  if (!domain) return res.status(400).json({ error: 'Missing domain query' });

  const cacheKey = `enrich3:${domain}`;
  const cached = cache.get(cacheKey);
  if (cached && (now() - cached.ts) < CACHE_TTL_MS) {
    return res.status(200).json(cached.value);
  }

  const root = await fetchRootHtml(domain);
  const ogTitle = root && root.html ? extractMetaField(root.html, ['og:title', 'title', 'twitter:title']) : '';
  const ogDescription = root && root.html ? extractMetaField(root.html, ['og:description','description','twitter:description']) : '';
  const ogImage = root && root.html ? extractMetaField(root.html, ['og:image','twitter:image','image']) : null;

  const domainParts = domain.split('.');
  const base = domainParts.slice(0, domainParts.length - 1).join(' ');
  const inferredName = base.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const alt1 = domainParts[0].replace(/-/g, ' ');
  const alt2 = domain.replace(/\.(com|net|org|co|io|ai)$/, '').replace(/-/g, ' ');
  const candidates = [ogTitle, inferredName, alt1, alt2].filter(Boolean);

  let wikidataResult = null;
  try {
    wikidataResult = await tryWikidata(domain, candidates);
  } catch (err) { /* ignore */ }

  let wikiLong = null;
  try {
    // prefer ogTitle or wikidata name as title candidate
    const titleCandidate = (ogTitle) || (wikidataResult && wikidataResult.name) || candidates[0];
    if (titleCandidate) {
      wikiLong = await tryWikipediaLongExtract(titleCandidate);
    }
    // if wikiLong missing, try other candidates
    if (!wikiLong) {
      for (const q of candidates) {
        if (!q) continue;
        const w = await tryWikipediaLongExtract(q);
        if (w) { wikiLong = w; break; }
      }
    }
  } catch (err) { /* ignore */ }

  // OpenCorporates fallback for additional facts
  let oc = null;
  try {
    oc = await tryOpenCorporates(candidates[0] || inferredName);
  } catch {}

  const facts = wikidataResult ? (wikidataResult.facts || {}) : {};
  if (!facts.official_website && root && root.url) facts.official_website = root.url;
  if (!facts.image && ogImage) facts.image = ogImage;
  if (!facts.incorporation_date && oc && oc.facts && oc.facts.incorporation_date) facts.incorporation_date = oc.facts.incorporation_date;

  const name = wikidataResult?.name || (wikiLong && wikiLong.title) || (candidates[0] || domainParts[0] || domain);
  const summaryText = wikiLong ? (wikiLong.description || '') : (ogDescription || '');
  const narrative = composeNarrative({ name, facts, summary: summaryText });

  const out = {
    domain,
    name,
    description: summaryText ? paraphraseShort(summaryText) : '',
    narrative,
    image: facts.image || (wikiLong && wikiLong.image) || ogImage || null,
    url: facts.official_website || (wikiLong && wikiLong.url) || (root && root.url) || null,
    source: wikiLong ? 'wikipedia' : (wikidataResult ? 'wikidata' : (oc ? 'opencorporates' : (ogDescription ? 'og' : 'none'))),
    facts
  };

  cache.set(cacheKey, { ts: now(), value: out });
  return res.status(200).json(out);
}
