import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req, VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  // TODO: Store in database (e.g., Vercel KV or Supabase free tier)
  // For now, use simple in-memory (not production-ready)
  const userId = Date.now().toString();
  // Set user as free by default
  const user = { id: userId, email, password, subscription: 'free' };  // Hash password in production

  res.status(201).json({ user, message: 'Signed up successfully' });
}
