export default function handler(req, res) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/userId=([^;]+)/);
  const userId = match ? match[1] : null;

  const isPro = userId === 'pro_123';

  res.status(200).json({
    isPro,
    user: isPro ? { email: 'you@novahunt.ai', subscription: 'pro' } : null
  });
}
