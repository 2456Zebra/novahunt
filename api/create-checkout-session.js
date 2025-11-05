// /pages/api/create-checkout-session.js
// Next API route: accepts POST, handles OPTIONS preflight, returns JSON
import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, successUrl, cancelUrl } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email is required' });

  // Dev fallback: mock URL if Stripe env vars missing
  if (!process.env.STRIPE_SECRET || !process.env.STRIPE_PRICE_ID) {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || 'localhost';
    const mockUrl = `${proto}://${host}/?mock-checkout=1&email=${encodeURIComponent(email)}`;
    return res.status(200).json({ url: mockUrl });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET);
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: successUrl || `${req.headers.referer || '/'}?success=1`,
      cancel_url: cancelUrl || `${req.headers.referer || '/'}?canceled=1`,
    });

    const checkoutUrl = session.url || (session.id ? `https://checkout.stripe.com/pay/${session.id}` : null);
    if (!checkoutUrl) return res.status(500).json({ error: 'Stripe did not return a checkout URL' });
    return res.status(200).json({ url: checkoutUrl });
  } catch (err) {
    console.error('Stripe create session failed:', err);
    return res.status(500).json({ error: 'Unable to create checkout session' });
  }
}
