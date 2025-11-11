// pages/api/emails.js
import fetch from "node-fetch";
import cheerio from "cheerio";

const cache = new Map();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: "Domain required" });

  const key = domain.toLowerCase();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < 3600000) return res.json(cached.data);

  const company = domain.replace(/\..+$/, ""); // coca-cola.com → coca-cola
  const people = [];

  try {
    // === 1️⃣ Wikipedia executives ===
    const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(company)}`;
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

    // === 2️⃣ Crunchbase fallback ===
    if (people.length === 0) {
      const cbUrl = `https://r.jina.ai/http://www.crunchbase.com/organization/${company}`;
      const cbRes = await fetch(cbUrl);
      if (cbRes.ok) {
        const text = await cbRes.text();
        const lines = text.split("\n");
        for (const line of lines) {
          const match = line.match(
            /([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s+(CEO|CFO|COO|CTO|President|Director|Manager|Head)/i
          );
          if (match) {
            const [first, ...lastParts] = match[1].split(" ");
            const last = lastParts.join(" ");
            people.push({ first, last, title: match[2] });
          }
        }
      }
    }

    // === 3️⃣ Email pattern generation ===
    const patterns = [
      (f, l) => `${f.toLowerCase()}.${l.toLowerCase()}@${domain}`,
      (f, l) => `${f[0].toLowerCase()}${l.toLowerCase()}@${domain}`,
      (f, l) => `${f.toLowerCase()}${l[0].toLowerCase()}@${domain}`,
      (f, l) => `${f.toLowerCase()}@${domain}`,
    ];

    const emails = new Set();
    for (const p of people) {
      for (const gen of patterns) emails.add(gen(p.first, p.last));
    }
    ["info", "contact", "sales", "support", "press"].forEach((g) =>
      emails.add(`${g}@${domain}`)
    );

    // === 4️⃣ MX validation ===
    const validate = async (email) => {
      try {
        const mx = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
        const j = await mx.json();
        return j.Answer ? 90 : 80;
      } catch {
        return 70;
      }
    };

    const results = await Promise.all(
      [...emails].map(async (email) => {
        const score = await validate(email);
        const person = people.find(
          (p) =>
            email.includes(p.first?.toLowerCase()) &&
            email.includes(p.last?.toLowerCase())
        );
        return {
          email,
          first_name: person?.first || "",
          last_name: person?.last || "",
          position: person?.title || "General",
          score: person ? score + 5 : score,
        };
      })
    );

    const output = {
      total: results.length,
      results: results.sort((a, b) => b.score - a.score),
    };
    cache.set(key, { data: output, ts: Date.now() });
    res.json(output);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
}
