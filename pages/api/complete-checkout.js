// pages/api/complete-checkout.js
// Validates a Stripe Checkout Session and returns a simple account object.
// This is useful as a fallback when a client returns with session_id in the URL.
// Environment:
// - STRIPE_SECRET_KEY (sk_test_... or sk_live_...)
// Note: production-grade approach should rely on webhooks (see pages/api/webhooks.js).

export default async function handler(req, res) {
  const { session_id } = req.query || {};
  if (!session_id) return res.status(400).send('Missing session_id');

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;
  if (!STRIPE_SECRET_KEY) {
    // Demo fallback: return an account object using a synthetic email
    const demoEmail = `stripe_user_${session_id.slice(0,8)}@novahunt.ai`;
    const account = { email: demoEmail, plan: 'Pro', searches: 100, reveals: 50, createdAt: Date.now() };
    return res.status(200).json({ account, warning: 'Demo mode: no Stripe key configured on server.' });
  }

  try {
    const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(session_id)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!stripeRes.ok) {
      const text = await stripeRes.text().catch(() => '');
      console.error(`Stripe API error fetching session ${session_id}:`, stripeRes.status, text);
      if (stripeRes.status === 404) {
        return res.status(502).send(`Stripe API error: ${stripeRes.status} ${text} — common causes: session id invalid or secret key mismatch (test vs live).`);
      }
      return res.status(502).send(`Stripe API error: ${stripeRes.status} ${text}`);
    }

    const session = await stripeRes.json();
    const email = (session.customer_details && session.customer_details.email) || session.customer_email || null;
    const paymentStatus = session.payment_status || session.status || 'unknown';

    // In production: create/update account in DB here.
    const account = {
      email: email || `stripe_user_${session_id.slice(0,8)}@novahunt.ai`,
      plan: 'Pro',
      stripe_customer: session.customer || null,
      stripe_subscription: session.subscription || null,
      searches: 100,
      reveals: 50,
      createdAt: Date.now()
    };

    const payload = { account, paymentStatus };
    if (!email) payload.warning = 'Payment confirmed but Stripe session did not include email.';

    return res.status(200).json(payload);
  } catch (err) {
    console.error('complete-checkout unexpected error', err);
    return res.status(500).send('Server error');
  }
}
