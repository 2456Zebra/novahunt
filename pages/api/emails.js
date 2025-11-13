// pages/api/emails.js
import * as cheerio from "cheerio";

const CACHE_TTL = 1000 * 60 * 60; // 1h
const cache = new Map();

const SEARCH_PATHS = [
  "/", "/contact", "/contact-us", "/about", "/about-us", "/team",
  "/leadership", "/people", "/executive-team", "/management", "/press",
  "/news", "/investors", "/who-we-are", "/company/leadership"
];

const GENERIC_LOCALPARTS = ["info","contact","press","sales","support","hello","team","media","careers"];
const GARBAGE_WORDS = /(haunted|factory|enter|demo|example|test|packand|keep|promo|subscribe|newsletter|click)/i;

function normalizeDomain(d) {
  return d.replace(/^https?:\/\//i, "").replace(/^www\./i, "").trim().toLowerCase();
}
async function fetchText(url, timeoutMs = 8000) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: controller.signal });
    clearTimeout(id);
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
}

function extractEmailsFromHtml(html, domain) {
  if (!html) return [];
  const rx = new RegExp(`\\b[A-Za-z0-9._%+\\-]+@${domain.replace(/\./g,"\\.")}\\b`, "gi");
  const matches = html.match(rx) || [];
  const out = [];
  for (const m of matches) {
    const e = m.toLowerCase();
    // basic sanity: no spaces, not too many punctuation, no garbage tokens
    if (/\s/.test(e)) continue;
    if (/[\|\[\]\{\}<>]/.test(e)) continue;
    const local = e.split("@")[0];
    if (GARBAGE_WORDS.test(local)) continue;
    out.push(e);
  }
  return Array.from(new Set(out));
}

function extractPeopleFromHtml(html) {
  if (!html) return [];
  const $ = cheerio.load(html);
  const texts = [];
  $("h1,h2,h3,h4,li,p,span,td,th,div").each((_, el) => {
    const t = $(el).text().trim();
    if (t && t.length > 3 && t.length < 400) texts.push(t);
  });

  const people = [];
  const nameTitleRegex = /([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,4})\s*(?:[,\-–—\|:])?\s*(CEO|CFO|COO|CTO|CMO|President|Chairman|Vice President|VP|Director|Manager|Head|Lead|Executive|Founder|Co-Founder|Managing Director|Chief)/i;
  for (const txt of texts) {
    const m = txt.match(nameTitleRegex);
    if (!m) continue;
    const full = m[1].trim();
    if (!/^[A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3}$/.test(full)) continue; // skip weird tokens
    const parts = full.split(/\s+/);
    const first = parts.shift();
    const last = parts.join(" ");
    const title = (m[2] || "").trim();
    if (!first || !last || !title) continue;
    people.push({ first, last, title, snippet: txt });
  }
  // dedupe
  const seen = new Set();
  return people.filter(p => {
    const k = (p.first + "|" + p.last).toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function generatePatterns(first, last, domain) {
  const f = (first || "").toLowerCase().replace(/\s+/g,'');
  const l = (last || "").toLowerCase().replace(/\s+/g,'');
  const set = new Set();
  if (f && l) {
    set.add(`${f}.${l}@${domain}`);
    set.add(`${f}${l}@${domain}`);
    set.add(`${f}_${l}@${domain}`);
    set.add(`${f}-${l}@${domain}`);
    set.add(`${f[0]}${l}@${domain}`);
    set.add(`${f}${l[0] || ""}@${domain}`);
  }
  if (f) set.add(`${f}@${domain}`);
  return Array.from(set);
}

async function checkMX(domain) {
  try {
    const r = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
    if (!r.ok) return false;
    const j = await r.json();
    return !!j.Answer;
  } catch {
    return false;
  }
}

function clamp(n,a=60,b=100){ return Math.max(a, Math.min(b, Math.round(n))); }
function titleWeight(t=""){
  const s = (t||"").toUpperCase();
  if (s.includes("CEO") || s.includes("CHIEF") || s.includes("PRESIDENT")) return 100;
  if (s.includes("CFO")||s.includes("COO")||s.includes("CTO")||s.includes("CMO")) return 95;
  if (s.includes("VP")||s.includes("VICE")) return 85;
  if (s.includes("DIRECTOR")) return 80;
  if (s.includes("MANAGER")) return 72;
  return 66;
}

function scoreEmail({ email, personMatch, explicitFound, mxOk }) {
  let score = 66;
  if (explicitFound && personMatch) score = 98;
  else if (explicitFound) score = 92;
  else if (personMatch && mxOk) score = 90 + Math.min(6, Math.round((titleWeight(personMatch.title || "") - 60)/6));
  else if (personMatch) score = 78 + Math.round((titleWeight(personMatch.title || "") - 60)/10);
  else if (GENERIC_LOCALPARTS.includes(email.split("@")[0])) score = 66;
  else if (mxOk) score = 72;
  else score = 60;
  if (!mxOk) score = Math.max(60, score - 10);
  if (/[0-9]/.test(email.split("@")[0])) score = Math.max(60, score - 6);
  return clamp(score, 60, 100);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { domain } = req.body || {};
  if (!domain || typeof domain !== "string") return res.status(400).json({ error: "Domain required" });

  const clean = normalizeDomain(domain);
  const cacheKey = `emails:${clean}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return res.json(cached.data);

  try {
    const mxOk = await checkMX(clean);

    const discoveredPeople = [];
    const discoveredEmails = new Set();

    const base = `https://${clean}`;
    for (const p of SEARCH_PATHS) {
      if (discoveredPeople.length >= 20) break;
      const url = base + p;
      const html = await fetchText(url, 6000);
      if (!html) continue;
      extractEmailsFromHtml(html, clean).forEach(e => discoveredEmails.add(e));
      const people = extractPeopleFromHtml(html);
      for (const person of people) {
        const key = (person.first + "|" + person.last).toLowerCase();
        if (!discoveredPeople.find(dp => (dp.first + "|" + dp.last).toLowerCase() === key)) {
          person.source = url;
          discoveredPeople.push(person);
        }
      }
    }

    // fallback: public search snippets (no LinkedIn scraping), uses Bing proxy
    if (discoveredPeople.length === 0) {
      try {
        const q = encodeURIComponent(`site:${clean} (CEO OR CFO OR "Chief" OR President OR "Vice President" OR Director OR Manager)`);
        const proxyUrl = `https://r.jina.ai/http://www.bing.com/search?q=${q}`;
        const html = await fetchText(proxyUrl, 6000);
        if (html) {
          const $ = cheerio.load(html);
          $("li.b_algo").each((_, el) => {
            const title = $(el).find("h2").text() || "";
            const snippet = $(el).find(".b_caption p").text() || "";
            const combined = (title + " " + snippet).trim();
            const match = combined.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3})\s*(?:,|-|–|—)?\s*(CEO|CFO|President|Director|Manager|Head|Lead|Founder)?/i);
            if (match) {
              const parts = match[1].split(/\s+/);
              const first = parts.shift();
              const last = parts.join(" ");
              const title = match[2] || "";
              if (first && last) {
                const key = (first+last).toLowerCase();
                if (!discoveredPeople.find(dp => (dp.first+dp.last).toLowerCase() === key)) {
                  discoveredPeople.push({ first, last, title, source: "search-snippet" });
                }
              }
            }
          });
        }
      } catch {}
    }

    // add some common generic localparts
    GENERIC_LOCALPARTS.forEach(lp => discoveredEmails.add(`${lp}@${clean}`));

    // generate patterns for discovered people (exec-focused)
    for (const p of discoveredPeople.slice(0, 40)) {
      if (!p.first || !p.last) continue;
      const pats = generatePatterns(p.first, p.last, clean);
      pats.forEach(e => discoveredEmails.add(e));
    }

    // assemble and filter results
    const results = [];
    const seen = new Set();

    function findPersonForEmail(email) {
      const e = email.toLowerCase();
      for (const p of discoveredPeople) {
        const f = (p.first || "").toLowerCase();
        const l = (p.last || "").toLowerCase();
        if (!f) continue;
        if (e.includes(`${f}.${l}`) || e.includes(`${f}${l}`) || e.includes(`${f[0]}${l}`) || e.includes(`${f}@`)) return p;
      }
      return null;
    }

    for (const email of discoveredEmails) {
      const low = email.toLowerCase();
      if (seen.has(low)) continue;
      if (GARBAGE_WORDS.test(low)) continue;
      seen.add(low);

      // determine if it was explicitly found in extracted pages
      // (since we added extracted emails directly, treat them as explicit if present)
      const explicitFound = false; // optional: track per-source extraction if desired
      const person = findPersonForEmail(low);
      const s = scoreEmail({ email: low, personMatch: person, explicitFound, mxOk });
      results.push({
        email: low,
        first_name: person?.first || "",
        last_name: person?.last || "",
        position: person?.title || (GENERIC_LOCALPARTS.includes(low.split("@")[0]) ? "General" : "Unknown"),
        score: s
      });
    }

    // if only generics and we have people, synthesize a few top guessed exec addresses
    const nonGeneric = results.some(r => !GENERIC_LOCALPARTS.includes(r.email.split("@")[0]));
    if (!nonGeneric && discoveredPeople.length > 0) {
      for (const p of discoveredPeople.slice(0, 8)) {
        for (const ge of generatePatterns(p.first, p.last, clean)) {
          if (seen.has(ge)) continue;
          seen.add(ge);
          const s = scoreEmail({ email: ge, personMatch: p, explicitFound: false, mxOk });
          results.push({
            email: ge,
            first_name: p.first,
            last_name: p.last,
            position: p.title || "Executive",
            score: s
          });
        }
      }
    }

    // final sort
    results.sort((a,b) => b.score - a.score);
    const output = { total: results.length, results };
    cache.set(cacheKey, { data: output, ts: Date.now() });

    console.log("emails debug:", { domain: clean, discoveredPeople: discoveredPeople.length, discoveredEmails: discoveredEmails.size, mxOk });
    return res.json(output);
  } catch (err) {
    console.error("emails handler fatal:", err);
    return res.status(500).json({ error: "Search failed" });
  }
}
