export default function handler(req, res) {
  // Read cookie from request headers
  const cookies = req.headers.cookie || '';
  const userIdMatch = cookies.match(/userId=([^;]+)/);
  const userId = userIdMatch ? userIdMatch[1] : null;

  if (!userId) {
    return res.status(200).json({ isPro: false, user: null });
  }

  // Simulate PRO user (test@novahunt.ai or pro_123)
  const isPro = userId === 'pro_123';

  res.status(200).json({
    isPro,
    user: {
      id: userId,
      email: isPro ? 'test@novahunt.ai' : 'user@example.com',
      subscription: isPro ? 'pro' : 'free'
    }
  });
}
