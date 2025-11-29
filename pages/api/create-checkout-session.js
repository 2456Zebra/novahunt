import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/*
  Create Checkout session: use request origin (or referer) to dynamically build
  success_url so Stripe redirects back to the same origin (preview or prod).
*/
function getRequestOrigin(req) {
  const origin = req.headers.origin || (req.headers.referer ? (() => {
    try { const u = new URL(req.headers.referer); return `${u.protocol}//${u.host}`; } catch { return null; }
  })() : null);
  if (origin) return origin.replace(/\/$/, '');
  if (process.env.SUCCESS_URL_BASE) return process.env.SUCCESS_URL_BASE.replace(/\/$/, '');
  return (req.headers['x-forwarded-proto'] ? `${req.headers['x-forwarded-proto']}://` : '') + (req.headers.host || '');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { priceId, email } = body;
    if (!priceId) return res.status(400).json({ error: 'Missing priceId' });

    const origin = getRequestOrigin(req);
    const successBase = origin || process.env.SUCCESS_URL_BASE || 'https://novahunt.ai';
    const success_url = `${successBase}/api/session-from-checkout?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url = `${successBase}/plans`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url,
      cancel_url,
      customer_email: email || undefined,
      metadata: { origin: origin || '' },
    });

    return res.status(200).json({ url: session.url, id: session.id });
  } catch (err) {
    console.error('[create-checkout-session] error', err && err.message ? err.message : err);
    return res.status(500).json({ error: (err && err.message) || 'Server error' });
  }
}
