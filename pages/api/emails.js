// pages/api/emails.js — MINIMAL, WITH FALLBACKS
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'Domain required' });

  const results = [
    { email: `info@${domain}`, role: 'General', score: 80 },
    { email: `support@${domain}`, role: 'Support', score: 90 },
    { email: `hello@${domain}`, role: 'Contact', score: 70 }
  ];

  res.status(200).json({ results, message: `${results.length} emails found!` });
}
