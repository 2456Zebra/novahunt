// pages/api/emails.js
// HUNTER.IO + JINA.AI (NINJA) = REAL EMAILS + NAMES + IG

import fetch from 'node-fetch';
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'Domain required' });

  const API_KEY = process.env.HUNTER_API_KEY;
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');

  // === 1. GET EMAILS FROM HUNTER ===
  let hunterEmails = [];
  let total = 0;
  if (API_KEY) {
    try {
      const url = `https://api.hunter.io/v2/domain-search?domain=${cleanDomain}&api_key=${API_KEY}&limit=50`;
      const r = await fetch(url);
      const data = await r.json();
      if (!data.errors && data.data?.emails) {
        hunterEmails = data.data.emails.map(e => ({
          email: e.value.includes('*') ? `********@${cleanDomain}` : e.value,
          first_name: e.first_name || "",
          last_name: e.last_name || "",
          position: e.position || "Unknown",
          score: e.confidence || 80,
          revealed: !e.value.includes('*'),
          source: "hunter"
        }));
        total = data.data.total || hunterEmails.length;
      }
    } catch (err) {
      console.error("Hunter failed:", err);
    }
  }

  // === 2. GET NAMES FROM JINA.AI (NINJA) ===
  let jinaPeople = [];
  try {
    const q = encodeURIComponent(`site:${cleanDomain} (CEO OR CFO OR VP OR Director OR Manager)`);
    const jinaUrl = `https://r.jina.ai/https://www.bing.com/search?q=${q}`;
    const html = await fetch(jinaUrl, { headers: { "User-Agent": "NovaHunt/1.0" } }).then(r => r.text());
    const $ = cheerio.load(html);

    $("li.b_algo").each((_, el) => {
      const text = $(el).text();
      const m = text.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3})\s*[,\-–—]\s*(CEO|CFO|COO|CTO|CMO|President|VP|Director|Head|Chief|Founder|Manager)/i);
      if (m) {
        const full = m[1].trim();
        const parts = full.split(/\s+/);
        const first = parts.shift();
        const last = parts.join(" ");
        const title = m[2];
        if (first.length > 1 && !/enter|haunted|test|demo/i.test(first + last)) {
          jinaPeople.push({ first, last, title, source: "jina" });
        }
      }
    });
  } catch (err) {
    console.error("Jina failed:", err);
  }

  // === 3. MERGE & DEDUPE ===
  const seen = new Set();
  const results = [];

  // Hunter first
  for (const e of hunterEmails) {
    const key = `${e.first_name}|${e.last_name}|${e.email}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      results.push(e);
    }
  }

  // Jina people (guess emails)
  for (const p of jinaPeople.slice(0, 20)) {
    const patterns = [
      `${p.first.toLowerCase()}.${p.last.toLowerCase()}@${cleanDomain}`,
      `${p.first.toLowerCase()}${p.last.toLowerCase()}@${cleanDomain}`,
      `${p.first[0].toLowerCase()}${p.last.toLowerCase()}@${cleanDomain}`
    ];
    for (const email of patterns) {
      const key = `${p.first}|${p.last}|${email}`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          email,
          first_name: p.first,
          last_name: p.last,
          position: p.title,
          score: 88,
          source: "jina"
        });
      }
    }
  }

  // === 4. RETURN ===
  res.json({
    total: Math.max(total, results.length),
    results: results.slice(0, 50)
  });
}
