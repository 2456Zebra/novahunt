import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { priceId, successPath = '/auth/stripe-success', quantity = 1 } = req.body || {};

    if (!priceId) {
      return res.status(400).json({ ok: false, error: 'Missing priceId' });
    }

    const origin = process.env.SITE_URL || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;

    // IMPORTANT: include {CHECKOUT_SESSION_ID} in success_url so Stripe appends session_id
    const successUrl = `${origin}${successPath}?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/signup?canceled=true`;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription', // or 'payment' depending on your flow
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: Number(quantity || 1) }],
      // include the placeholder so Stripe will append the actual id on redirect
      success_url: successUrl,
      cancel_url: cancelUrl,
      // optional: include metadata you'll use later
      metadata: {
        createdBy: 'novahunt-checkout'
      }
    });

    // Return session id & url so client can redirect
    return res.status(200).json({ ok: true, url: session.url, id: session.id });
  } catch (err) {
    console.error('create-checkout error', err && (err.message || err));
    return res.status(500).json({ ok: false, error: 'Could not create checkout session' });
  }
}
