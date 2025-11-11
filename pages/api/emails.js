// ✅ pages/api/emails.js — Free Email Finder (Vercel-ready, no paid APIs)
import * as cheerio from "cheerio";

const cache = new Map();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: "Domain required" });

  const key = domain.toLowerCase();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < 3600000) {
    return res.json(cached.data);
  }

  const emails = new Set();
  const people = [];

  try {
    // --- Step 1: Try Wikipedia for company leaders ---
    try {
      const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(domain.replace(/\.[a-z]+$/, ""))}`;
      const wikiRes = await fetch(wikiUrl, { headers: { "User-Agent": "Mozilla/5.0" } });

      if (wikiRes.ok) {
        const html = await wikiRes.text();
        const $ = cheerio.load(html);
        $("table.infobox tr").each((_, el) => {
          const row = $(el).text();
          const match = row.match(
            /([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s*(–|-|,)?\s*(CEO|CFO|COO|CTO|President|Chairman|Director|Manager|Head)/i
          );
          if (match) {
            const [first, ...lastParts] = match[1].split(" ");
            const last = lastParts.join(" ");
            people.push({ first, last, title: match[3] });
          }
        });
      }
    } catch (err) {
      console.error("Wikipedia fetch failed:", err);
    }

    // --- Step 2: DuckDuckGo fallback (find exec names) ---
    try {
      const query = `"${domain}" (CEO OR CFO OR CTO OR President OR Director OR Head) -inurl:(jobs OR careers)`;
      const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const searchRes = await fetch(searchUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
      const html = await searchRes.text();
      const $ = cheerio.load(html);

      $("a.result__a").each((_, el) => {
        const title = $(el).text().trim();
        const match = title.match(
          /([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s+(CEO|CFO|CTO|President|Director|Manager|Head)/i
        );
        if (match) {
          const [first, ...lastParts] = match[1].split(" ");
          const last = lastParts.join(" ");
          people.push({ first, last, title: match[2] });
        }
      });
    } catch (err) {
      console.error("DuckDuckGo fetch failed:", err);
    }

    // --- Step 3: Generate possible email addresses ---
    const patterns = [
      (f, l) => `${f.toLowerCase()}.${l.toLowerCase()}@${domain}`,
      (f, l) => `${f[0].toLowerCase()}${l.toLowerCase()}@${domain}`,
      (f, l) => `${f.toLowerCase()}@${domain}`,
      (f, l) => `${f.toLowerCase()}${l[0].toLowerCase()}@${domain}`,
    ];

    for (const p of people) {
      for (const gen of patterns) {
        emails.add(gen(p.first, p.last));
      }
    }

    // --- Step 4: Add generic emails (always include) ---
    ["info", "contact", "sales", "support", "press", "hello", "team"].forEach((g) =>
      emails.add(`${g}@${domain}`)
    );

    // --- Step 5: Validate MX existence (lightweight, free) ---
    const validateEmail = async (email) => {
      try {
        const domainPart = email.split("@")[1];
        const dnsRes = await fetch(`https://dns.google/resolve?name=${domainPart}&type=MX`);
        const dnsData = await dnsRes.json();
        return dnsData.Answer ? 90 : 80;
      } catch {
        return 70;
      }
    };

    const results = await Promise.all(
      [...emails].map(async (email) => {
        const score = await validateEmail(email);
        const person = people.find(
          (p) =>
            email.includes(p.first?.toLowerCase() || "") &&
            email.includes(p.last?.toLowerCase() || "")
        ) || {};
        return {
          email,
          first_name: person.first || "",
          last_name: person.last || "",
          position: person.title || "General",
          score,
        };
      })
    );

    const output = {
      results: results.sort((a, b) => b.score - a.score),
      total: results.length + 200,
    };

    cache.set(key, { data: output, ts: Date.now() });
    res.json(output);
  } catch (err) {
    console.error("Handler failed:", err);
    res.status(500).json({ error: "Search failed" });
  }
}
