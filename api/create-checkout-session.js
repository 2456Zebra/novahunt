import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { successUrl, cancelUrl, email } = req.body || {};

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      customer_email: email,
      metadata: { user_email: email || '' },
      success_url: successUrl || 'https://novahunt.ai/?success=1',
      cancel_url: cancelUrl || 'https://novahunt.ai/?canceled=1',
    });

    res.status(200).json({ url: session.url, id: session.id });
  } catch (err) {
    console.error('Stripe create session error', err);
    res.status(500).json({ error: 'Internal error' });
  }
}