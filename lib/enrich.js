// lib/enrich.js
export async function scrapeLinkedIn(domain) {
  try {
    const query = `"${domain}" (CEO OR CMO OR Marketing OR Sales OR Founder) site:linkedin.com/in`;
    const html = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`).then(r => r.text());
    const matches = html.matchAll(/<a class="result__a" href="[^"]*linkedin\.com\/in\/([^"]+)"/g);
    const profiles = [];
    for (const m of matches) {
      const name = decodeURIComponent(m[1]).replace(/-/g, " ").replace(/\s+/g, " ");
      const [first, ...lastParts] = name.split(" ");
      const last = lastParts.join(" ");
      if (first && last) {
        profiles.push({ first, last, title: "Executive" });
      }
      if (profiles.length >= 10) break;
    }
    return profiles;
  } catch (err) {
    console.error("LinkedIn scrape failed:", err);
    return [];
  }
}

export async function scrapeWebsite(domain) {
  try {
    const url = `https://${domain}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    const html = await res.text();

    const emails = [...html.matchAll(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g)]
      .map(m => m[1].toLowerCase())
      .filter(e => e.endsWith(`@${domain}`))
      .slice(0, 15);

    return { emails: emails.map(email => ({ email })) };
  } catch (err) {
    console.error("Website scrape failed:", err);
    return { emails: [] };
  }
}
