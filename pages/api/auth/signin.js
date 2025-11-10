import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  // TODO: Verify against database
  // For now, simple check (replace with real auth like NextAuth.js)
  const user = { id: '1', email, subscription: 'pro' };  // Assume PRO for your test subscription

  if (user) {
    // Set cookie for session (simple JWT-like)
    res.setHeader('Set-Cookie', `token=${user.id}; Path=/; Max-Age=86400; HttpOnly`);  // 1 day
    res.status(200).json({ user, message: 'Signed in successfully' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
}
