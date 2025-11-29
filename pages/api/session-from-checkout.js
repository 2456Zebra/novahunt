import Stripe from 'stripe';

/*
  Robust session-from-checkout handler.

  Steps:
  1) Retrieve the Checkout session by session_id.
  2) Try to determine the buyer's email using (in order):
     - session.customer_details?.email
     - session.customer_email
     - stripe.customers.retrieve(session.customer).email (if session.customer is a customer id)
  3) Set a host-only client cookie nh_user_email (Path=/; Max-Age=1 year; SameSite=Lax; Secure).
  4) Redirect to the app root '/' (no email in URL).

  Notes:
  - Do NOT set the cookie Domain attribute so it attaches to the current origin (preview vs prod).
  - For production you should replace this cookie with a secure, server-issued HttpOnly session cookie.
*/

export default async function handler(req, res) {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    console.error('[session-from-checkout] missing STRIPE_SECRET_KEY');
    return res.status(500).send('Server misconfiguration: STRIPE_SECRET_KEY missing');
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);

  const { session_id } = req.query;
  if (!session_id) {
    console.error('[session-from-checkout] missing session_id');
    return res.status(400).send('Missing session_id query parameter');
  }

  try {
    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Try candidate locations for email
    let email = (session && session.customer_details && session.customer_details.email) || session.customer_email || '';

    // If empty and session.customer looks like a customer id, fetch the customer
    if (!email && session && session.customer) {
      try {
        const cust = await stripe.customers.retrieve(session.customer);
        if (cust && cust.email) email = cust.email;
      } catch (custErr) {
        // log but continue — we'll still redirect
        console.warn('[session-from-checkout] failed to retrieve customer', custErr && custErr.message ? custErr.message : custErr);
      }
    }

    console.info('[session-from-checkout] session_id=', session_id, 'email=', email ? '[REDACTED]' : '(none)', 'session_exists=', !!session);

    // Set a client-readable cookie bound to the current host (no Domain=)
    // For production you may want to set Secure; most production sites run on HTTPS.
    const cookieValue = encodeURIComponent(email || '');
    const maxAge = 60 * 60 * 24 * 365; // 1 year
    const cookie = `nh_user_email=${cookieValue}; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`;
    res.setHeader('Set-Cookie', cookie);

    // Redirect to homepage (do not leak email via URL)
    res.writeHead(302, { Location: '/' });
    return res.end();
  } catch (err) {
    console.error('[session-from-checkout] error retrieving session', err && err.message ? err.message : err);
    return res.status(500).send('Error retrieving checkout session');
  }
}
