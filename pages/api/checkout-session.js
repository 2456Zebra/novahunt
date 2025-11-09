import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { plan } = req.body;
  const priceId = plan === 'annual' 
    ? process.env.STRIPE_PRICE_ANNUAL 
    : process.env.STRIPE_PRICE_MONTHLY;

  if (!priceId) return res.status(400).json({ error: 'Invalid plan' });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'https://novahunt.ai/?success=true',
      cancel_url: 'https://novahunt.ai/upgrade',
    });
    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
