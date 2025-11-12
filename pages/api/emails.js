// pages/api/emails.js
// FULLY LEGAL | NO LINKEDIN SCRAPING | NO TOS VIOLATION
// REAL EXEC NAMES + PATTERN GUESSING + JUNK FILTER

import * as cheerio from "cheerio";

const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const cache = new Map();

const SEARCH_PATHS = [
  "/", "/contact", "/about", "/team", "/leadership", "/people",
  "/executive-team", "/management", "/investors", "/press", "/news"
];

const GENERIC_LOCALPARTS = ["info", "contact", "press", "sales", "support", "hello", "team", "media", "careers"];
const JUNK_WORDS = /^(enter|haunted|factory|test|example|demo|keep|pack|and|the|promo|win|click|visit|shop|buy|signup|register|login)$/i;

const EXEC_ROLES = ["CEO", "CFO", "COO", "CTO", "CMO", "President", "VP", "Director", "Head", "Chief", "Founder", "Manager"];

function normalizeDomain(d) {
  return d.replace(/^https?:\/\//i, "").replace(/^www\./i, "").trim().toLowerCase();
}

async function fetchText(url, timeout = 8000) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const r = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "Mozilla/5.0" } });
    clearTimeout(id);
    return r.ok ? await r.text() : null;
  } catch {
    return null;
  }
}

function extractEmails(html, domain) {
  if (!html) return new Set();
  const matches = html.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g) || [];
  const emails = new Set();
  for (const raw of matches) {
    const e = raw.toLowerCase().trim();
    if (!e.endsWith(`@${domain}`)) continue;
    if (JUNK_WORDS.test(e.split("@")[0])) continue;
    const context = html.slice(Math.max(0, html.indexOf(e) - 100), html.indexOf(e) + 100);
    if (/<(script|style|meta)/i.test(context)) continue;
    emails.add(e);
  }
  return emails;
}

function extractPeople(html) {
  if (!html) return [];
  const $ = cheerio.load(html);
  const blocks = [];
  $("h1,h2,h3,h4,li,p,span,div").each((_, el) => {
    const t = $(el).text().trim();
    if (t && t.length > 10 && t.length < 400) blocks.push(t);
  });

  const people = [];
  const regex = /([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3})\s*[,\-–—\|\:]?\s*(CEO|CFO|COO|CTO|CMO|President|Chairman|VP|Director|Head|Chief|Founder|Manager)/i;

  for (const b of blocks) {
    const m = b.match(regex);
    if (!m) continue;
    const full = m[1].trim();
    if (!/^[A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3}$/.test(full)) continue;
    const parts = full.split(/\s+/);
    const first = parts.shift();
    const last = parts.join(" ");
    const title = (m[2] || "").trim();
    if (first.length < 2 || first.length > 20) continue;
    people.push({ first, last, title, snippet: b });
  }

  const seen = new Set();
  return people.filter(p => {
    const key = `${p.first}|${p.last}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function generateExecutiveEmails(people, domain) {
  const emails = [];
  const patterns = [
    (f, l) => `${f}.${l}@${domain}`,
    (f, l) => `${f}${l}@${domain}`,
    (f, l) => `${f[0]}${l}@${domain}`,
    (f, l) => `${f}@${domain}`
  ];

  for (const p of people) {
    if (!EXEC_ROLES.some(r => p.title.toUpperCase().includes(r))) continue;
    const f = p.first.toLowerCase();
    const l = p.last.toLowerCase();
    for (const fn of patterns) {
      const email = fn(f, l);
      emails.push({
        email,
        first_name: p.first,
        last_name: p.last,
        position: p.title,
        score: 90,
        source: "exec-pattern"
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
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { domain } = req.body || {};
  if (!domain) return res.status(400).json({ error: "Domain required" });

  const clean = normalizeDomain(domain);
  const cacheKey = `emails:${clean}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return res.json(cached.data);

  try {
    const mxOk = await checkMX(clean);
    const discoveredEmails = new Set();
    const discoveredPeople = [];

    const base = `https://${clean}`;
    for (const path of SEARCH_PATHS) {
      if (discoveredPeople.length >= 15) break;
      const url = base + path;
      const html = await fetchText(url);
      if (!html) continue;

      const emails = extractEmails(html, clean);
      emails.forEach(e => discoveredEmails.add(e));

      const people = extractPeople(html);
      for (const p of people) {
        if (!discoveredPeople.find(dp => `${dp.first} ${dp.last}` === `${p.first} ${p.last}`)) {
          discoveredPeople.push(p);
        }
      }
    }

    // Add generic fallbacks
    GENERIC_LOCALPARTS.forEach(lp => discoveredEmails.add(`${lp}@${clean}`));

    // Generate executive emails
    const execEmails = generateExecutiveEmails(discoveredPeople, clean);

    // Build final results
    const results = [];
    const seen = new Set();

    // Add executive guesses first
    for (const e of execEmails) {
      if (seen.has(e.email)) continue;
      seen.add(e.email);
      results.push(e);
    }

    // Add discovered emails
    for (const email of discoveredEmails) {
      if (seen.has(email)) continue;
      seen.add(email);
      const local = email.split("@")[0];
      const isGeneric = GENERIC_LOCALPARTS.includes(local);
      results.push({
        email,
        first_name: "",
        last_name: "",
        position: isGeneric ? "General" : "Unknown",
        score: isGeneric ? (mxOk ? 72 : 66) : (mxOk ? 85 : 75),
        source: "pattern"
      });
    }

    results.sort((a, b) => b.score - a.score);
    const output = { total: results.length, results: results.slice(0, 50) };
    cache.set(cacheKey, { data: output, ts: Date.now() });

    return res.json(output);
  } catch (err) {
    console.error("Search failed:", err);
    return res.status(500).json({ error: "Search failed" });
  }
}
