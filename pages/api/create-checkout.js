import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    console.log('Wrong method:', req.method);
    return res.status(405).end();
  }

  const { plan } = req.body;
  console.log('Plan:', plan);

  const priceId = plan === 'annual'
    ? process.env.STRIPE_PRICE_ANNUAL
    : process.env.STRIPE_PRICE_MONTHLY;

  console.log('Price ID:', priceId);
  console.log('STRIPE_SECRET_KEY exists?', !!process.env.STRIPE_SECRET_KEY);
  console.log('STRIPE_PRICE_MONTHLY:', process.env.STRIPE_PRICE_MONTHLY);
  console.log('STRIPE_PRICE_ANNUAL:', process.env.STRIPE_PRICE_ANNUAL);

  if (!priceId) {
    console.error('Missing price ID for plan:', plan);
    return res.status(400).json({ error: 'Invalid plan' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'https://novahunt.ai/?success=true',
      cancel_url: 'https://novahunt.ai/upgrade',
    });
    console.log('Stripe session created:', session.id);
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    console.error('Full error:', err);
    res.status(500).json({ error: err.message });
  }
}
