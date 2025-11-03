// api/import.js - simple CSV import/enrich stub (demo)
// Accepts JSON POST body { emails: ["a@b.com", ...] } or file uploads in production
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const body = req.body || {};
  const emails = Array.isArray(body.emails) ? body.emails : [];
  if (!emails.length) return res.status(400).json({ error: 'emails array required in JSON body' });

  // Demo enrichment: return objects with email and fake enrichment fields
  const enriched = emails.slice(0, 100).map((e, i) => ({
    email: e,
    name: `Imported Person ${i + 1}`,
    title: i % 2 === 0 ? 'Marketing Manager' : 'Sales Lead',
    confidence: 0.6 + (i % 4) * 0.1
  }));

  return res.status(200).json({ count: enriched.length, results: enriched });
}