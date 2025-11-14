// Create a Stripe Checkout session. Expects POST { priceId } and header x-nh-session containing the nh_session string.
// Returns { url } to redirect the browser to Stripe Checkout.
import Stripe from 'stripe';
import { kv } from '@vercel/kv';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-11-15' });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { priceId, successUrl = process.env.SUCCESS_URL, cancelUrl = process.env.CANCEL_URL } = req.body || {};
    if (!priceId) return res.status(400).json({ error: 'priceId required in request body' });

    // Determine email from local session header (the client sends nh_session JSON string as header)
    let sessionHeader = req.headers['x-nh-session'] || null;
    let email = null;
    if (sessionHeader) {
      try {
        // sessionHeader may be JSON string or plain email; handle both
        const parsed = JSON.parse(sessionHeader);
        email = parsed?.email || null;
      } catch (e) {
        // not JSON — maybe plain email
        if (typeof sessionHeader === 'string' && sessionHeader.includes('@')) email = sessionHeader;
      }
    }

    // Create a checkout session. Set customer_email so Stripe will create a Customer with that email.
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || 'https://YOUR_SITE/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: cancelUrl || 'https://YOUR_SITE/cancel',
      allow_promotion_codes: true,
      customer_email: email || undefined,
      metadata: {
        nh_session: sessionHeader || '',
      },
    });

    // Save temporary mapping of checkout id -> email to help post-processing (optional)
    try {
      if (typeof kv !== 'undefined' && email) {
        await kv.set(`stripe:checkout:${session.id}`, { email }, { ex: 60 * 60 * 6 }); // 6 hours
      }
    } catch (e) {
      console.warn('KV write error (checkout mapping)', e);
    }

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-checkout-session error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
