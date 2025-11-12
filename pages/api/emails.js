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
    return {
