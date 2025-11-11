export default function handler(req, res) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/userId=([^;]+)/);
  const userId = match ? match[1] : null;

  // REAL PRO CHECK — only if you paid
  const isPro = userId === 'pro_customer_id_from_stripe'; // replace with real Stripe customer ID after payment

  res.status(200).json({
    isPro,
    user: isPro ? { email: 'you@novahunt.ai', subscription: 'pro' } : null
  });
}
