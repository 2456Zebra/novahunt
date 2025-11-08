// pages/api/checkout.js
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { plan } = req.body;
  const priceId = plan === 'annual' 
    ? process.env.STRIPE_PRICE_ANNUAL 
    : process.env.STRIPE_PRICE_MONTHLY;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${req.headers.origin}/?success=true`,
      cancel_url: `${req.headers.origin}/upgrade`,
    });
    res.redirect(303, session.url);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
