export default function handler(req, res) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/userId=([^;]+)/);
  const userId = match ? match[1] : null;

  // Force PRO for testing (remove when Stripe live)
  const isPro = true;

  res.status(200).json({
    isPro,
    user: { id: userId || 'test', email: 'test@novahunt.ai', subscription: 'pro' }
  });
}
