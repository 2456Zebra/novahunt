// scripts/crawler.js
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const DOMAINS_FILE = path.join(__dirname, 'domains.txt');
const OUT_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const GENERIC_LOCALPARTS = ['info', 'contact', 'press', 'sales', 'support', 'hello', 'team', 'media'];

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
    const snippet = $('.b_caption p', el).text() || '';
    const href = $('h2 a', el).attr('href') || '';
    nodes.push({ title: title.trim(), snippet: snippet.trim(), href });
  });
  return nodes;
}

async function crawlDomain(domain) {
  const d = normalizeDomain(domain);
  const outFile = path.join(OUT_DIR, `${d}.json`);
  const candidatePaths = [
    `https://${d}/about`, `https://${d}/about-us`, `https://${d}/about/leadership`,
    `https://${d}/team`, `https://${d}/leadership`, `https://${d}/company/leadership`,
    `https://${d}/our-team`, `https://${d}/about/team`, `https://${d}/company/people`,
    `https://${d}/who-we-are`, `https://${d}/leadership/team`, `https://${d}/press`,
    `https://${d}/news`, `https://${d}/investors`, `https://${d}/leadership/management`
  ];
  const foundPeople = [];
  const foundEmails = new Set();

  for (const p of candidatePaths) {
    const html = await fetchText(p, 8000);
    if (!html) continue;
    extractEmailsFromHtml(html, d).forEach(e => foundEmails.add(e));
    const people = extractPeopleFromHtml(html);
    people.forEach(p => {
      if (!foundPeople.find(fp => (fp.first + fp.last).toLowerCase() === (p.first + p.last).toLowerCase())) {
        foundPeople.push({ ...p, source: p });
      }
    });
    if (foundPeople.length >= 12) break;
  }

  // Search snippets (including PDFs)
  const snippets = await searchSnippets(d);
  for (const s of snippets.slice(0, 8)) {
    if (s.href && s.href.startsWith('http')) {
      const html = await fetchText(s.href, 8000);
      if (html) {
        extractEmailsFromHtml(html, d).forEach(e => foundEmails.add(e));
        extractPeopleFromHtml(html).forEach(p => {
          if (!foundPeople.find(fp => (fp.first + fp.last).toLowerCase() === (p.first + p.last).toLowerCase())) {
            foundPeople.push({ ...p, source: s.href });
          }
        });
      } else {
        extractPeopleFromHtml(s.title + ' ' + s.snippet).forEach(p => {
          if (!foundPeople.find(fp => (fp.first + fp.last).toLowerCase() === (p.first + p.last).toLowerCase())) {
            foundPeople.push({ ...p, source: 'snippet' });
          }
        });
      }
    }
  }

  // Add generics
  GENERIC_LOCALPARTS.forEach(g => foundEmails.add(`${g}@${d}`));

  const out = {
    domain: d,
    timestamp: new Date().toISOString(),
    people: foundPeople,
    emails: Array.from(foundEmails)
  };
  fs.writeFileSync(outFile, JSON.stringify(out, null, 2));
  console.log('Wrote', outFile, 'People:', foundPeople.length, 'Emails:', foundEmails.size);
}

async function main() {
  const list = fs.existsSync(DOMAINS_FILE) ? fs.readFileSync(DOMAINS_FILE, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean) : [];
  for (const dom of list) {
    console.log('Crawling', dom);
    await crawlDomain(dom);
    await new Promise(r => setTimeout(r, 2000)); // Pause
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
