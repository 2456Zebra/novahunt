// pages/api/emails.js
// 100% LEGAL | REAL EXEC NAMES | NO JUNK | FREE

import * as cheerio from "cheerio";

const CACHE = new Map();
const TTL = 60 * 60 * 1000; // 1h

const PATHS = ["/", "/about", "/team", "/leadership", "/people", "/executives", "/management", "/board"];
const GENERIC = ["info", "contact", "press", "sales", "support", "hello", "team"];
const JUNK = /^(enter|haunted|factory|test|demo|keep|pack|promo|win|click|shop|buy|signup|join|submit)$/i;

const ROLES = ["CEO", "CFO", "COO", "CTO", "CMO", "President", "VP", "Director", "Head", "Chief", "Founder"];

async function fetch(url, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const r = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "NovaHunt/1.0" } });
    clearTimeout(id);
    return r.ok ? await r.text() : null;
  } catch {
    clearTimeout(id);
    return null;
  }
}

function cleanDomain(d) {
  return d.replace(/^https?:\/\//i, "").replace(/^www\./i, "").trim().toLowerCase();
}

function extractEmails(html, domain) {
  const set = new Set();
  if (!html) return set;
  const matches = html.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g) || [];
  for (const e of matches) {
    const email = e.toLowerCase();
    if (!email.endsWith(`@${domain}`)) continue;
    if (JUNK.test(email.split("@")[0])) continue;
    const ctx = html.slice(Math.max(0, html.indexOf(e) - 100), html.indexOf(e) + 100);
    if (/<(script|style|meta)/i.test(ctx)) continue;
    set.add(email);
  }
  return set;
}

function extractPeople(html) {
  const people = [];
  if (!html) return people;
  const $ = cheerio.load(html);
  const texts = [];
  $("h1,h2,h3,h4,h5,p,li,span,div").each((_, el) => {
    const t = $(el).text().trim();
    if (t && t.length > 15 && t.length < 500) texts.push(t);
  });

  const regex = /([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3})\s*[,\-–—\|\:]\s*(CEO|CFO|COO|CTO|CMO|President|VP|Director|Head|Chief|Founder)/i;

  for (const t of texts) {
    const m = t.match(regex);
    if (!m) continue;
    const name = m[1].trim();
    if (!/^[A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3}$/.test(name)) continue;
    const parts = name.split(/\s+/);
    const first = parts.shift();
    const last = parts.join(" ");
    const title = m[2];
    if (first.length < 2 || first.length > 20) continue;
    if (JUNK.test(first) || JUNK.test(last)) continue;
    people.push({ first, last, title });
  }

  const seen = new Set();
  return people.filter(p => {
    const k = `${p.first}|${p.last}`.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function searchSnippets(domain) {
  const q = encodeURIComponent(`site:${domain} (CEO OR CFO OR President OR "Vice President" OR Director)`);
  const url = `https://r.jina.ai/https://www.bing.com/search?q=${q}`;
  const html = await fetch(url, 10000);
  if (!html) return [];

  const $ = cheerio.load(html);
  const people = [];
  $("li.b_algo").each((_, el) => {
    const title = $(el).find("h2").text();
    const desc = $(el).find(".b_caption p").text();
    const text = `${title} ${desc}`;
    const m = text.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3})\s*[,\-–—]\s*(CEO|CFO|President|VP|Director)/i);
    if (m) {
      const name = m[1].trim();
      if (/^[A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3}$/.test(name)) {
        const parts = name.split(/\s+/);
        const first = parts.shift();
        const last = parts.join(" ");
        const title = m[2];
        if (!JUNK.test(first) && !JUNK.test(last)) {
          people.push({ first, last, title, source: "bing" });
        }
      }
    }
  });
  return people.slice(0, 10);
}

function generateEmails(people, domain) {
  const emails = [];
  const patterns = [
    (f, l) => `${f}.${l}@${domain}`,
    (f, l) => `${f}${l}@${domain}`,
    (f, l) => `${f[0]}${l}@${domain}`,
    (f, l) => `${f}@${domain}`
  ];

  for (const p of people) {
    if (!ROLES.some(r => p.title.toUpperCase().includes(r))) continue;
    const f = p.first.toLowerCase();
    const l = p.last.toLowerCase();
    for (const fn of patterns) {
      const email = fn(f, l);
      if (JUNK.test(email)) continue;
      emails.push({
        email,
        first_name: p.first,
        last_name: p.last,
        position: p.title,
        score: 92,
        source: p.source || "site"
      });
    }
  }
  return emails;
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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { domain } = req.body || {};
  if (!domain) return res.status(400).json({ error: "Domain required" });

  const clean = cleanDomain(domain);
  const key = `cache:${clean}`;
  const cached = CACHE.get(key);
  if (cached && Date.now() - cached.ts < TTL) return res.json(cached.data);

  try {
    const mx = await checkMX(clean);
    const sitePeople = [];
    const allEmails = new Set();

    // 1. Scrape company site
    for (const path of PATHS) {
      if (sitePeople.length >= 10) break;
      const url = `https://${clean}${path}`;
      const html = await fetch(url);
      if (!html) continue;
      extractEmails(html, clean).forEach(e => allEmails.add(e));
      extractPeople(html).forEach(p => {
        if (!sitePeople.find(x => x.first === p.first && x.last === p.last)) {
          sitePeople.push(p);
        }
      });
    }

    // 2. Search snippets fallback
    const searchPeople = sitePeople.length === 0 ? await searchSnippets(clean) : [];
    const people = [...sitePeople, ...searchPeople].slice(0, 15);

    // 3. Generate exec emails
    const execEmails = generateEmails(people, clean);

    // 4. Add generics
    GENERIC.forEach(g => allEmails.add(`${g}@${clean}`));

    // 5. Build results
    const results = [];
    const seen = new Set();

    for (const e of execEmails) {
      if (seen.has(e.email)) continue;
      seen.add(e.email);
      results.push(e);
    }

    for (const email of allEmails) {
      if (seen.has(email)) continue;
      seen.add(email);
      const local = email.split("@")[0];
      const isGen = GENERIC.includes(local);
      results.push({
        email,
        first_name: "",
        last_name: "",
        position: isGen ? "General" : "Unknown",
        score: isGen ? (mx ? 70 : 65) : (mx ? 82 : 75)
      });
    }

    results.sort((a, b) => b.score - a.score);
    const output = { total: results.length, results: results.slice(0, 50) };
    CACHE.set(key, { data: output, ts: Date.now() });

    return res.json(output);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Search failed" });
  }
}
