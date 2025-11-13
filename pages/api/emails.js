// 100% LEGAL | NO LINKEDIN | NO TOS VIOLATION
// REAL NAMES + EXEC PATTERN GUESSING + JUNK KILLER
// Added: GET health response + small robustness improvements

import * as cheerio from "cheerio";

const CACHE_TTL = 60 * 60 * 1000;
const cache = new Map();

const SEARCH_PATHS = [
  "/", "/contact", "/about", "/team", "/leadership", "/people",
  "/executive-team", "/management", "/investors", "/press"
];

const GENERIC = ["info", "contact", "press", "sales", "support", "hello", "team", "media"];
const JUNK = /^(enter|haunted|factory|test|example|demo|keep|pack|and|the|promo|win|click|visit|shop|buy|signup|register|login|submit|join)$/i;

const EXEC_ROLES = ["CEO", "CFO", "COO", "CTO", "CMO", "President", "VP", "Director", "Head", "Chief", "Founder"];

function normalizeDomain(d) {
  return d.replace(/^https?:\/\//i, "").replace(/^www\./i, "").trim().toLowerCase();
}

async function fetchText(url, timeout = 8000) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const r = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "Mozilla/5.0" } });
    clearTimeout(id);
    return r && r.ok ? await r.text() : null;
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
    const local = e.split("@")[0];
    if (JUNK.test(local)) continue;
    if (local.includes("haunted") || local.includes("factory")) continue;
    const ctxIndex = html.indexOf(raw);
    const ctx = html.slice(Math.max(0, ctxIndex - 100), ctxIndex + raw.length + 100);
    if (/<(script|style|meta)/i.test(ctx)) continue;
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
    if (JUNK.test(first) || JUNK.test(last)) continue;
    people.push({ first, last, title });
  }

  const seen = new Set();
  return people.filter(p => {
    const key = `${p.first}|${p.last}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function generateExecEmails(people, domain) {
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
      if (JUNK.test(email)) continue;
      emails.push({
        email,
        first_name: p.first,
        last_name: p.last,
        position: p.title,
        score: 90
      });
    }
  }
  return emails;
}

async function checkMX(domain) {
  try {
    // DNS-over-HTTPS query to Google
    const r = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
    if (!r.ok) return false;
    const j = await r.json();
    return !!(j && (j.Answer || j.Answers));
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  // Simple health for GETs to help debug frontend JSON parse issues
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, note: "POST domain JSON -> { domain: 'example.com' }" });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { domain } = req.body || {};
  if (!domain) return res.status(400).json({ error: "Domain required" });

  const clean = normalizeDomain(domain);
  const cacheKey = `emails:${clean}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return res.json(cached.data);

  try {
    const mxOk = await checkMX(clean);
    const emails = new Set();
    const people = [];

    const base = `https://${clean}`;
    for (const path of SEARCH_PATHS) {
      if (people.length >= 12) break;
      const url = base + path;
      const html = await fetchText(url);
      if (!html) continue;

      extractEmails(html, clean).forEach(e => emails.add(e));
      extractPeople(html).forEach(p => {
        if (!people.find(x => `${x.first} ${x.last}` === `${p.first} ${p.last}`)) {
          people.push(p);
        }
      });
    }

    // Generic fallbacks
    GENERIC.forEach(lp => emails.add(`${lp}@${clean}`));

    // Executive guesses
    const execEmails = generateExecEmails(people, clean);

    // Build results
    const results = [];
    const seen = new Set();

    // Add execs first
    for (const e of execEmails) {
      if (seen.has(e.email)) continue;
      seen.add(e.email);
      results.push(e);
    }

    // Add others
    for (const email of emails) {
      if (seen.has(email)) continue;
      seen.add(email);
      const local = email.split("@")[0];
      const isGen = GENERIC.includes(local);
      results.push({
        email,
        first_name: "",
        last_name: "",
        position: isGen ? "General" : "Unknown",
        score: isGen ? (mxOk ? 72 : 66) : (mxOk ? 85 : 75)
      });
    }

    results.sort((a, b) => b.score - a.score);
    const output = { total: results.length, results: results.slice(0, 50) };
    cache.set(cacheKey, { data: output, ts: Date.now() });

    return res.json(output);
  } catch (err) {
    console.error("Search failed:", err);
    // Always send proper JSON so the frontend doesn't break parsing
    return res.status(500).json({ error: "Search failed" });
  }
}
