export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { priceId } = req.body;
    if (!priceId) return res.status(400).json({ error: 'priceId required' });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.origin}/?success=true`,
      cancel_url: `${req.headers.origin}/?canceled=true`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-checkout error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
