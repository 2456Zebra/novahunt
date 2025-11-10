export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  // Simulate PRO user (for your $100 subscription)
  const isProEmail = email.includes('novahunt') || email === 'test@novahunt.ai';

  const user = {
    id: isProEmail ? 'pro_123' : Date.now().toString(),
    email,
    subscription: isProEmail ? 'pro' : 'free'
  };

  // Save in cookie
  res.setHeader('Set-Cookie', `userId=${user.id}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax`);

  res.status(200).json({
    user,
    message: isProEmail ? 'Welcome, PRO user!' : 'Signed in (free plan)'
  });
}
