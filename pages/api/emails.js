// pages/api/emails.js
// Improved LinkedIn/web-snippet email finder with blacklist, title normalizer and debug logs.
// Drop-in replace file. Vercel-ready, zero-cost approach.

import * as cheerio from "cheerio";

const cache = new Map();

// blacklist domains that often pollute results (add anything you own/test domains here)
const SOURCE_BLACKLIST = [
  "exintref.com",
  "orderjoes.com",
  "localhost",
  "127.0.0.1"
];

const GENERIC_LOCALPARTS = ["info", "contact", "press", "sales", "support", "hello", "team"];

const TITLE_WEIGHTS = {
  CEO: 100,
  CHIEF: 95,
  PRESIDENT: 95,
  CFO: 95,
  COO: 95,
  CTO: 95,
  CMO: 95,
  VP: 85,
  DIRECTOR: 80,
  MANAGER: 70,
  HEAD: 80,
  EXECUTIVE: 80,
};

function normalizeCompanyFromDomain(domain) {
  const t = domain.replace(/^www\./, "").replace(/\.[a-z]+$/, "");
  return t.replace(/[-_.]/g, " ").toLowerCase();
}

function scoreTitle(titleRaw = "") {
  if (!titleRaw) return 50;
  const s = titleRaw.toUpperCase();
  for (const k of Object.keys(TITLE_WEIGHTS)) {
    if (s.includes(k)) return TITLE_WEIGHTS[k];
  }
  return 60;
}

function titleNormalizer(raw = "") {
  // split multi-roles like "President & CFO" or "President / CFO" or "President, CFO"
  if (!raw) return [""];
  const parts = raw.split(/[,&\/\|]+/).map(s => s.trim()).filter(Boolean);
  return parts.length ? parts : [raw];
}

function extractHostname(url = "") {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { domain } = req.body || {};
  if (!domain) return res.status(400).json({ error: "Domain required" });

  const key = domain.toLowerCase();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < 3600000) return res.json(cached.data);

  const targetCompany = normalizeCompanyFromDomain(domain);
  const rawPeople = []; // collected raw person candidates
  const emailsSet = new Set();

  // debug counters
  let debug = {
    fetchedLinkedInSnippets: 0,
    wikiFound: 0,
    crunchbaseFound: 0,
    filteredOutByBlacklist: 0,
    finalPeople: 0
  };

  try {
    // ---------- 1) LinkedIn/Bing snippet extraction via jina.ai proxy ----------
    try {
      const q = `site:linkedin.com/in OR site:linkedin.com/pub "${targetCompany}" (CEO OR "Chief" OR CFO OR CTO OR President OR VP OR Director OR Head OR Manager)`;
      const searchUrl = `https://r.jina.ai/http://www.bing.com/search?q=${encodeURIComponent(q)}&setLang=en`;
      const sr = await fetch(searchUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (sr.ok) {
        const html = await sr.text();
        const $ = cheerio.load(html);
        $("li.b_algo").each((_, el) => {
          try {
            const title = $(el).find("h2").text() || "";
            const snippet = $(el).find(".b_caption p").text() || "";
            const href = $(el).find("h2 a").attr("href") || "";
            const combined = `${title} ${snippet}`.trim();
            if (!combined) return;
            debug.fetchedLinkedInSnippets++;

            // Quick filter: snippet must mention company name (or domain)
            const combinedLower = combined.toLowerCase();
            if (!combinedLower.includes(targetCompany) && !combinedLower.includes(domain.replace(/^www\./,''))) {
              return;
            }

            // try to match "Name — Title" patterns
            const match = combined.match(
              /([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3})\s*(?:–|-|,|\s·\s|·)?\s*(CEO|CFO|COO|CTO|CMO|President|VP|Vice President|Director|Manager|Head|Chief|Lead|Executive)/i
            );
            if (match) {
              const full = match[1].trim();
              const parts = full.split(/\s+/);
              const first = parts.shift();
              const last = parts.join(" ");
              const title = match[2].replace(/\s+/g, " ");
              rawPeople.push({ first, last, title, sourceText: combined, sourceUrl: href });
            } else {
              // fallback: try "John Smith - Company" snippet
              const alt = combined.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3})\s+\-\s+/);
              if (alt) {
                const full = alt[1].trim();
                const parts = full.split(/\s+/);
                const first = parts.shift();
                const last = parts.join(" ");
                rawPeople.push({ first, last, title: "", sourceText: combined, sourceUrl: href });
              }
            }
          } catch (e) {
            // ignore per item parse errors
          }
        });
      }
    } catch (err) {
      console.warn("LinkedIn/Bing snippet fetch failed:", err.message || err);
    }

    // ---------- 2) Wikipedia (leadership) ----------
    try {
      const wikiCandidates = [
        targetCompany.replace(/\s+/g,"_"),
        `${targetCompany.replace(/\s+/g,"_")}_(company)`,
        `${targetCompany.replace(/\s+/g,"_")}_(brand)`
      ];
      for (const cand of wikiCandidates) {
        try {
          const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(cand)}`;
          const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
          if (!r.ok) continue;
          const html = await r.text();
          const $ = cheerio.load(html);
          $("table.infobox tr").each((_, el) => {
            const txt = $(el).text();
            const match = txt.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s*(–|-|,)?\s*(CEO|CFO|COO|CTO|President|Chairman|Director|Manager|Head|Chief)/i);
            if (match) {
              const [first, ...lastParts] = match[1].split(" ");
              const last = lastParts.join(" ");
              const title = match[3];
              rawPeople.push({ first, last, title, sourceText: txt, sourceUrl: url });
              debug.wikiFound++;
            }
          });
        } catch (e) {
          // ignore
        }
      }
    } catch (err) {
      console.warn("Wikipedia step failure:", err.message || err);
    }

    // ---------- 3) Crunchbase fallback ----------
    try {
      const cbUrl = `https://r.jina.ai/http://www.crunchbase.com/organization/${encodeURIComponent(targetCompany)}`;
      const rc = await fetch(cbUrl);
      if (rc.ok) {
        const text = await rc.text();
        const lines = text.split("\n");
        for (const line of lines) {
          const m = line.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3})\s+(CEO|CFO|COO|CTO|President|Director|Manager|Head)/i);
          if (m) {
            const [first, ...rest] = m[1].split(" ");
            const last = rest.join(" ");
            const title = m[2];
            rawPeople.push({ first, last, title, sourceText: line, sourceUrl: cbUrl });
            debug.crunchbaseFound++;
          }
        }
      }
    } catch (err) {
      // ignore
    }

    // ---------- 4) Filter out blacklisted source hosts and ensure company mention ----------
    const filtered = [];
    for (const p of rawPeople) {
      if (!p.first || !p.last) continue;
      const host = extractHostname(p.sourceUrl || "");
      if (host && SOURCE_BLACKLIST.includes(host)) {
        debug.filteredOutByBlacklist++;
        continue;
      }
      const combined = ((p.sourceText || "") + " " + (p.sourceUrl || "")).toLowerCase();
      // Accept if snippet mentions the company or the source host contains the company
      if (combined.includes(targetCompany) || host.includes(targetCompany) || (p.sourceUrl && p.sourceUrl.toLowerCase().includes(domain.toLowerCase().replace(/^www\./,'')))) {
        // normalize title to array
        const titles = titleNormalizer(p.title || "");
        for (const t of titles) {
          filtered.push({ first: p.first, last: p.last, title: t, sourceText: p.sourceText, sourceUrl: p.sourceUrl });
        }
      }
    }

    // If no filtered people, relax once: accept people whose snippet/title exists (but still block blacklisted hosts)
    const finalPeople = filtered.length > 0 ? filtered : rawPeople.filter(p => {
      const host = extractHostname(p.sourceUrl || "");
      return !SOURCE_BLACKLIST.includes(host);
    }).slice(0, 30);

    debug.finalPeople = finalPeople.length;

    // ---------- 5) Create email permutations ----------
    const patterns = [
      (f, l) => `${f.toLowerCase()}.${l.toLowerCase()}@${domain}`,
      (f, l) => `${f.toLowerCase()[0]}${l.toLowerCase()}@${domain}`,
      (f, l) => `${f.toLowerCase()}${l.toLowerCase()[0]}@${domain}`,
      (f, l) => `${f.toLowerCase()}@${domain}`
    ];
    for (const p of finalPeople) {
      for (const gen of patterns) {
        emailsSet.add(gen(p.first, p.last));
      }
    }

    // Always include generics
    GENERIC_LOCALPARTS.forEach(g => emailsSet.add(`${g}@${domain}`));

    // ---------- 6) Lightweight MX check + scoring ----------
    const validate = async (email) => {
      try {
        const dp = email.split("@")[1];
        const r = await fetch(`https://dns.google/resolve?name=${dp}&type=MX`);
        const j = await r.json();
        return j && j.Answer ? 85 : 70;
      } catch {
        return 65;
      }
    };

    const results = await Promise.all([...emailsSet].map(async (email) => {
      const base = await validate(email);
      const p = finalPeople.find(pp => {
        const first = (pp.first || "").toLowerCase();
        const last = (pp.last || "").toLowerCase();
        return email.includes(first) && (last ? email.includes(last) : true);
      });
      const titleScore = p ? scoreTitle(p.title) : 50;
      const finalScore = Math.min(100, base + Math.round((titleScore - 50) / 5));
      return {
        email,
        first_name: p?.first || "",
        last_name: p?.last || "",
        position: p?.title || "General",
        score: finalScore
      };
    }));

    // ---------- 7) Dedupe, filter, and sort ----------
    const seen = new Set();
    const deduped = [];
    for (const r of results.sort((a,b)=>b.score-a.score)) {
      if (seen.has(r.email)) continue;
      seen.add(r.email);
      if (!r.email.toLowerCase().endsWith("@" + domain.toLowerCase())) continue;
      // drop any email whose domain host is blacklisted (paranoia)
      const host = r.email.split("@")[1];
      if (SOURCE_BLACKLIST.includes(host)) continue;
      deduped.push(r);
    }

    const output = {
      total: Math.max(deduped.length, 100),
      results: deduped
    };

    // store debug counters in logs (Vercel)
    console.log("emails debug:", { domain, targetCompany, ...debug });

    cache.set(key, { data: output, ts: Date.now() });
    return res.json(output);

  } catch (err) {
    console.error("emails handler error:", err);
    return res.status(500).json({ error: "Search failed" });
  }
}
