// pages/api/emails.js
import * as cheerio from "cheerio";

const CACHE_TTL = 1000 * 60 * 60; // 1 hour
const cache = new Map();
const SEARCH_PATHS = [
  "/", "/contact", "/contact-us", "/about", "/about-us", "/team",
  "/leadership", "/people", "/executive-team", "/management", "/press",
  "/news", "/investors", "/who-we-are", "/company/leadership"
];
const GENERIC_LOCALPARTS = ["info","contact","press","sales","support","hello","team","media","careers"];

function normalizeDomain(d) {
  return d.replace(/^https?:\/\//i, "").replace(/^www\./i, "").trim().toLowerCase();
}

async function fetchText(url, timeoutMs = 9000) {
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
  const rx = new RegExp(`[A-Za-z0-9._%+\\-]+@${domain.replace(/\./g,"\\.")}`, "gi");
  const m = html.match(rx) || [];
  return Array.from(new Set(m.map(x => x.toLowerCase())));
}

function extractPeopleFromHtml(html) {
  if (!html) return [];
  const $ = cheerio.load(html);
  const blocks = [];
  $("h1,h2,h3,h4,li,p,span,td,th,div").each((_, el) => {
    const t = $(el).text().trim();
    if (t && t.length > 3 && t.length < 400) blocks.push(t);
  });

  const people = [];
  const nameTitleRegex = /([A-Z][a-z]+(?:[ \-'][A-Z][a-z]+){0,4})\s*(?:[,\-–—\|:])?\s*(?:(CEO|CFO|COO|CTO|CMO|President|Chairman|Vice President|VP|Director|Manager|Head|Lead|Executive|Founder|Co-Founder|Managing Director|President & CEO|Chief))/i;

  for (const b of blocks) {
    const m = b.match(nameTitleRegex);
    if (m) {
      const full = m[1].trim();
      const parts = full.split(/\s+/);
      const first = parts.shift();
      const last = parts.join(" ");
      const title = (m[2] || "").trim();
      if (first && first.length > 1 && first.length < 32) {
        people.push({ first, last, title, snippet: b });
      }
    }
  }

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
    if (!r.ok) return { ok: false, raw: null };
    const j = await r.json();
    return { ok: !!j.Answer, raw: j };
  } catch {
    return { ok: false, raw: null };
  }
}

function clamp(n, a=35, b=100){ return Math.max(a, Math.min(b, Math.round(n))); }

function titleWeight(title = "") {
  const s = (title || "").toUpperCase();
  if (s.includes("CEO") || s.includes("CHIEF") || s.includes("PRESIDENT")) return 100;
  if (s.includes("CFO") || s.includes("COO") || s.includes("CTO") || s.includes("CMO")) return 95;
  if (s.includes("VP") || s.includes("VICE")) return 85;
  if (s.includes("DIRECTOR")) return 80;
  if (s.includes("MANAGER")) return 70;
  return 60;
}

function scoreEmail({ email, personMatch, explicitFound, mxOk }) {
  let score = 50;
  if (explicitFound && personMatch) score = 98;
  else if (explicitFound) score = 92;
  else if (personMatch && mxOk) {
    const weight = titleWeight(personMatch.title || "");
    score = 90 + Math.min(6, Math.round((weight - 50) / 10));
  }
  else if (personMatch) {
    const weight = titleWeight(personMatch.title || "");
    score = 75 + Math.round((weight - 50) / 10);
  }
  else if (GENERIC_LOCALPARTS.includes(email.split("@")[0])) score = 65;
  else if (mxOk) score = 72;
  else score = 45;
  if (!mxOk) score = Math.max(35, score - 15);
  if (/[0-9]/.test(email.split("@")[0])) score = Math.max(35, score - 5);
  return clamp(score, 35, 100);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { domain } = req.body || {};
  if (!domain || typeof domain !== "string") return res.status(400).json({ error: "Domain required" });

  const clean = normalizeDomain(domain);
  const cacheKey = `emails:${clean}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return res.json(cached.data);
  }

  try {
    const mx = await checkMX(clean);
    const mxOk = mx.ok;

    const discoveredPeople = [];
    const discoveredEmails = new Set();

    const base = `https://${clean}`;
    for (const p of SEARCH_PATHS) {
      if (discoveredPeople.length >= 12) break;
      const url = base + p;
      const html = await fetchText(url, 6000);
      if (!html) continue;

      extractEmailsFromHtml(html, clean).forEach(e => discoveredEmails.add(e));
      const people = extractPeopleFromHtml(html);
      for (const person of people) {
        if (!discoveredPeople.find(dp => (dp.first + dp.last).toLowerCase() === (person.first + person.last).toLowerCase())) {
          person.source = url;
          discoveredPeople.push(person);
        }
      }
    }

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
            const match = (title + " " + snippet).match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3})\s*(?:,|-|–|—)?\s*(CEO|CFO|President|Director|Manager|Head|Lead|Founder)?/i);
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
      } catch (e) {}
    }

    GENERIC_LOCALPARTS.forEach(lp => discoveredEmails.add(`${lp}@${clean}`));
    for (const p of discoveredPeople.slice(0, 40)) {
      const patterns = generatePatterns(p.first, p.last, clean);
      patterns.forEach(e => discoveredEmails.add(e));
    }

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
      seen.add(low);

      const person = findPersonForEmail(low);
      const s = scoreEmail({ email: low, personMatch: person, explicitFound: false, mxOk });
      results.push({
        email: low,
        first_name: person?.first || "",
        last_name: person?.last || "",
        position: person?.title || (GENERIC_LOCALPARTS.includes(low.split("@")[0]) ? "General" : "Unknown"),
        score: s,
        source: person?.source || "pattern"
      });
    }

    results.sort((a, b) => b.score - a.score);
    const output = { total: results.length, results };
    cache.set(cacheKey, { data: output, ts: Date.now() });

    return res.json(output);
  } catch (err) {
    console.error("emails handler fatal:", err);
    return res.status(500).json({ error: "Search failed" });
  }
}
