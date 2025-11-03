// api/find-emails.js — Vercel Serverless Function (stub)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'No query' });

  // DEMO MODE: Return fake emails
  const fakeEmails = [
    `john.doe@${query}`,
    `jane.smith@${query}`,
    `marketing@${query}`,
    `sales@${query}`,
    `hr@${query}`
  ];

  // TODO: Replace with Apollo/Clearbit API
  // const apolloRes = await fetch(`https://api.apollo.io/v1/people/search`, { ... });

  res.status(200).json({ emails: fakeEmails });
}
