// api/find-emails.js - serverless function for Vercel
// Behavior: PROVIDER=demo (default) => deterministic fake leads
// Set PROVIDER=apollo|clearbit|hunter to enable real provider logic (not included here).
export default async function handler(req, res) {
  const domain = (req.query.domain || '').toLowerCase();
  if (!domain) return res.status(400).json({ error: 'domain required' });

  // Normalize to base host
  const toBase = (d) => d.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] || 'example.com';
  const base = toBase(domain);

  const demoLeads = [
    { email: `john.doe@${base}`, name: 'John Doe', title: 'Head of Marketing', confidence: 0.92 },
    { email: `jane.smith@${base}`, name: 'Jane Smith', title: 'VP Sales', confidence: 0.87 },
    { email: `marketing@${base}`, name: '', title: '', confidence: 0.8 },
    { email: `press@${base}`, name: '', title: '', confidence: 0.66 },
    { email: `info@${base}`, name: '', title: '', confidence: 0.55 }
  ];

  const provider = (process.env.PROVIDER || 'demo').toLowerCase();
  if (provider === 'demo') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ provider: 'demo', emails: demoLeads });
  }

  // provider not implemented yet
  return res.status(501).json({ error: 'provider not implemented', provider });
}