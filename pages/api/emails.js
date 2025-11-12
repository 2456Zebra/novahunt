// pages/api/emails.js
import { scrapeLinkedIn, scrapeWebsite } from "../../lib/enrich";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { domain } = req.body;
  if (!domain || !/^[\w.-]+\.[a-z]{2,}$/.test(domain)) return res.status(400).json({ error: "Invalid domain" });

  try {
    // Stage 1: Scrape public profiles
    const linkedIn = await scrapeLinkedIn(domain);
    const website = await scrapeWebsite(domain);

    // Stage 2: Build candidate list
    const candidates = new Map();
    const add = (email, first, last, title, source, score) => {
      if (!email.includes("@")) return;
      const key = email.toLowerCase();
      if (!candidates.has(key) || candidates.get(key).score < score) {
        candidates.set(key, { email, first_name: first, last_name: last, position: title, source, score });
      }
    };

    // From LinkedIn
    linkedIn.forEach(p => {
      const patterns = [
        `${p.first}.${p.last}@${domain}`,
        `${p.first}@${domain}`,
        `${p.first[0]}${p.last}@${domain}`,
        `${p.first}${p.last}@${domain}`
      ];
      patterns.forEach(email => add(email, p.first, p.last, p.title, "linkedin", 95));
    });

    // From website
    website.emails.forEach(e => {
      add(e.email, e.first || "", e.last || "", e.title || "Unknown", "website", 85);
    });

    // Stage 3: Sort & limit
    const results = Array.from(candidates.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);

    res.json({ results, total: results.length });
  } catch (err) {
    console.error("Enrich error:", err);
    res.status(500).json({ error: "Failed to enrich" });
  }
}
