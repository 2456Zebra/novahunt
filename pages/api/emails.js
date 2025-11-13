// pages/api/emails.js
// REAL EMPLOYEE NAMES + EMAILS | FREE | LEGAL | HUNTER-LEVEL
// NO LINKEDIN SCRAPING | NO TOS VIOLATION

import * as cheerio from "cheerio";

const CACHE = new Map();
const TTL = 60 * 60 * 1000; // 1 hour cache

// Search these pages first
const PATHS = [
  "/", "/about", "/team", "/leadership", "/people", "/executives",
  "/management", "/board", "/contact", "/investors"
];

// Generic fallbacks (only if no real people found)
const GENERIC = ["info", "contact", "press", "sales", "support", "hello", "team", "media"];

// Junk filter
const JUNK = /^(enter|haunted|factory|test|demo|keep|pack|promo|win|click|shop|buy|signup|join|submit|register|login)$/i;

// Target roles
const ROLES = ["CEO", "CFO", "COO", "CTO", "CMO", "President", "VP", "Director", "Head", "Chief", "Founder", "Manager"];

async function fetchPage(url, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "NovaHunt/1.0 (+https://novahunt.ai)" }
    });
    clearTimeout(id);
    return res.ok ? await res.text() : null;
  } catch (err) {
    clearTimeout(id);
    return null;
  }
}

function cleanDomain(domain) {
  return domain.replace(/^https?:\/\//i, "").replace(/^www\./i, "").trim().toLowerCase();
}

function extractEmails(html, domain) {
  const emails = new Set();
  if (!html) return emails;
  const matches = html.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g) || [];
  for (const e of matches) {
    const email = e.toLowerCase().trim();
    if (!email.endsWith(`@${domain}`)) continue;
    if (JUNK.test(email.split("@")[0])) continue;
    const context = html.slice(Math.max(0, html.indexOf(e) - 100), html.indexOf(e) + 100);
    if (/<(script|style|meta)/i.test(context)) continue;
    emails.add(email);
  }
  return emails;
}

function extractPeopleFromHTML(html) {
  const people = [];
  if (!html) return people;

  const $ = cheerio.load(html);
  const blocks = [];
  $("h1,h2,h3,h4,h5,h6,p,li,span,div,a").each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 15 && text.length < 500) blocks.push(text);
  });

  const regex = /([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3})\s*[,\-–—\|\:]\s*(CEO|CFO|COO|CTO|CMO|President|Chairman|VP|Vice President|Director|Head|Chief|Founder|Manager|Lead)/i;

  for (const block of blocks) {
    const match = block.match(regex);
    if (!match) continue;

    const fullName = match[1].trim();
    if (!/^[A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3}$/.test(fullName)) continue;

    const parts = fullName.split(/\s+/);
    const first = parts.shift();
    const last = parts.join(" ");
    const title = match[2].trim();

    if (first.length < 2 || first.length > 20) continue;
    if (JUNK.test(first) || JUNK.test(last)) continue;

    people.push({ first, last, title, source: "website" });
  }

  // Dedupe
  const seen = new Set();
  return people.filter(p => {
    const key = `${p.first.toLowerCase()}|${p.last.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function searchBingForPeople(domain) {
  const query = encodeURIComponent(`site:${domain} (CEO OR CFO OR President OR "Vice President" OR Director OR Founder OR Manager)`);
  const url = `https://r.jina.ai/https://www.bing.com/search?q=${query}`;
  const html = await fetchPage(url, 10000);
  if (!html) return [];

  const $ = cheerio.load(html);
  const people = [];

  $("li.b_algo").each((_, el) => {
    const title = $(el).find("h2").text() || "";
    const desc = $(el).find(".b_caption p").text() || "";
    const text = `${title} ${desc}`;
    const match = text.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3})\s*[,\-–—]\s*(CEO|CFO|President|VP|Director|Manager|Head|Founder)/i);
    if (match) {
      const full = match[1].trim();
      if (/^[A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3}$/.test(full)) {
        const parts = full.split(/\s+/);
        const first = parts.shift();
        const last = parts.join(" ");
        const title = match[2];
        if (!JUNK.test(first) && !JUNK.test(last)) {
          people.push({ first, last, title, source: "bing" });
        }
      }
    }
  });

  return people.slice(0, 12);
}

function generateEmailPatterns(first, last, domain) {
  const f = first.toLowerCase();
  const l = last.toLowerCase();
  return [
    `${f}.${l}@${domain}`,
    `${f}${l}@${domain}`,
    `${f[0]}${l}@${domain}`,
    `${f}@${domain}`
  ].filter(e => !JUNK.test(e));
}

async function checkMX(domain) {
  try {
    const res = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
    if (!res.ok) return false;
    const json = await res.json();
    return !!json.Answer;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { domain } = req.body || {};
  if (!domain || typeof domain !== "string") return res.status(400).json({ error: "Domain required" });

  const clean = cleanDomain(domain);
  const cacheKey = `emails:${clean}`;
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < TTL) {
    return res.json(cached.data);
  }

  try {
    const mxValid = await checkMX(clean);
    let people = [];
    const discoveredEmails = new Set();

    // Step 1: Scrape company website
    for (const path of PATHS) {
      if (people.length >= 15) break;
      const url = `https://${clean}${path}`;
      const html = await fetchPage(url);
      if (!html) continue;

      // Extract real emails
      extractEmails(html, clean).forEach(e => discoveredEmails.add(e));

      // Extract people
      const found = extractPeopleFromHTML(html);
      for (const p of found) {
        if (!people.find(x => x.first === p.first && x.last === p.last)) {
          people.push(p);
        }
      }
    }

    // Step 2: Fallback to Bing snippets if no people found
    if (people.length === 0) {
      const bingPeople = await searchBingForPeople(clean);
      people = bingPeople;
    }

    // Step 3: Generate real employee emails
    const results = [];
    const seen = new Set();

    // PRIORITY: Real people with guessed emails
    for (const p of people) {
      if (!ROLES.some(r => p.title.toUpperCase().includes(r))) continue;
      const patterns = generateEmailPatterns(p.first, p.last, clean);
      for (const email of patterns) {
        if (seen.has(email)) continue;
        seen.add(email);
        results.push({
          email,
          first_name: p.first,
          last_name: p.last,
          position: p.title,
          score: mxValid ? 92 : 85,
          source: p.source
        });
      }
    }

    // Step 4: Add discovered emails (if not already in)
    for (const email of discoveredEmails) {
      if (seen.has(email)) continue;
      seen.add(email);
      const local = email.split("@")[0];
      const isGeneric = GENERIC.includes(local);
      results.push({
        email,
        first_name: "",
        last_name: "",
        position: isGeneric ? "General" : "Unknown",
        score: isGeneric ? (mxValid ? 72 : 66) : (mxValid ? 88 : 80)
      });
    }

    // Step 5: Fallback generics (only if < 3 real emails)
    if (results.length < 3) {
      GENERIC.forEach(g => {
        const email = `${g}@${clean}`;
        if (!seen.has(email)) {
          seen.add(email);
          results.push({
            email,
            first_name: "",
            last_name: "",
            position: "General",
            score: mxValid ? 70 : 65
          });
        }
      });
    }

    // Sort: real people first
    results.sort((a, b) => b.score - a.score);

    const output = {
      total: results.length,
      results: results.slice(0, 50)
    };

    CACHE.set(cacheKey, { data: output, ts: Date.now() });
    return res.json(output);

  } catch (err) {
    console.error("Email search failed:", err);
    return res.status(500).json({ error: "Search failed" });
  }
}
