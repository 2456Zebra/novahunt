// scripts/crawler.js
// NOTE: made safe for bundlers by avoiding top-level `new URL(import.meta.url)` or file-system side-effects.
// This file now exports functions and a `main` entrypoint that performs FS work only when invoked in Node.
//
// Do NOT import this file from client-side code or components that run in the browser.

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

// Lazy helper to compute script directory only when run in Node (never executed in browser)
function getScriptDir() {
  // If running in a browser environment, bail out early
  if (typeof window !== 'undefined') return '.';
  try {
    // This runs only in Node when main() is invoked; safe to use import.meta.url here.
    return path.dirname(new URL(import.meta.url).pathname);
  } catch (err) {
    // If anything goes wrong, fall back to CWD
    return process.cwd ? process.cwd() : '.';
  }
}

async function fetchText(url, timeout = 15000) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const r = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
}

function normalizeDomain(d) {
  return d.replace(/^https?:\/\//, '').replace(/^www\./, '').trim().toLowerCase();
}

function extractEmailsFromHtml(html, domain) {
  if (!html) return [];
  const rx = new RegExp(`[A-Za-z0-9._%+-]+@${domain.replace(/\./g, '\\.')}`, 'gi');
  const m = html.match(rx);
  return m ? Array.from(new Set(m.map(x => x.toLowerCase()))) : [];
}

function extractPeopleFromHtml(html) {
  const $ = cheerio.load(html);
  const blocks = [];
  $('h1, h2, h3, h4, li, p, span, td, th').each((_, el) => {
    const t = $(el).text().trim();
    if (t && t.length > 2 && t.length < 400) blocks.push(t);
  });
  const people = [];
  const re = /([A-Z][a-z]+(?:[\s\-'][A-Z][a-z]+){0,4})[\s,–|:\-]*((CEO|CFO|COO|CTO|CMO|President|VP|Vice President|Director|Manager|Head|Lead|Founder|Co-Founder|Chairman)?)/i;
  for (const b of blocks) {
    const m = b.match(re);
    if (m) {
      const full = m[1].trim();
      const parts = full.split(/\s+/);
      const first = parts.shift();
      const last = parts.join(' ');
      const title = (m[2] || '').trim();
      people.push({ first, last, title, snippet: b });
    }
  }
  // Dedupe
  const seen = new Set();
  return people.filter(p => {
    const k = (p.first + p.last).toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function searchSnippets(domain, qappend = '') {
  const q = encodeURIComponent(`site:${domain} ${qappend} (CEO OR CFO OR "Chief" OR "President" OR "Vice President" OR Director OR Manager)`);
  const url = `https://www.bing.com/search?q=${q}`;
  const html = await fetchText(url, 10000);
  if (!html) return [];
  const $ = cheerio.load(html);
  const nodes = [];
  $('li.b_algo').each((_, el) => {
    const title = $('h2', el).text() || '';
    const snippet = $('p', el).text() || '';
    nodes.push({ title, snippet });
  });
  return nodes;
}

// Public main entrypoint — does FS operations only when explicitly invoked in Node.
export async function main(domains = []) {
  const scriptDir = getScriptDir();
  if (typeof window !== 'undefined') {
    // Do nothing in browser contexts
    return;
  }

  const DOMAINS_FILE = path.join(scriptDir, 'domains.txt');
  const OUT_DIR = path.join(scriptDir, '..', 'data');

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  // Example behavior: iterate domains and write basic outputs.
  for (const raw of domains) {
    const domain = normalizeDomain(raw);
    try {
      const html = await fetchText('https://' + domain);
      const emails = extractEmailsFromHtml(html, domain);
      const people = extractPeopleFromHtml(html);
      const outPath = path.join(OUT_DIR, `${domain}.json`);
      fs.writeFileSync(outPath, JSON.stringify({ domain, emails, people }, null, 2), 'utf8');
    } catch (err) {
      // continue on error
    }
  }
}

// Export helpers if other scripts want to reuse them (server-side only)
export { fetchText, normalizeDomain, extractEmailsFromHtml, extractPeopleFromHtml, searchSnippets };
