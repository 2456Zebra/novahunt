import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const token = req.cookies.token;

  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  // TODO: Get user from token (database lookup)
  const user = { id: token, email: 'test@example.com' };

  try {
    // Check Stripe subscription status
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId || 'cus_test_123',  // Replace with your test customer ID from Stripe
    });

    const isPro = subscriptions.data.length > 0 && subscriptions.data[0].status === 'active';

    res.status(200).json({ isPro, subscription: isPro ? 'pro' : 'free' });
  } catch (err) {
    res.status(500).json({ error: 'Subscription check failed' });
  }
}
