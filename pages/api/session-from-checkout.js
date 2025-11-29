import Stripe from 'stripe';

/*
  Robust session-from-checkout:
  - Reads session by session_id,
  - Extracts email from customer_details, session.customer_email, or customer lookup,
  - Sets host-only cookie nh_user_email (no Domain attr) so it attaches to the origin the browser is on.
  - Redirects to '/'.
*/
export default async function handler(req, res) {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    console.error('[session-from-checkout] missing STRIPE_SECRET_KEY');
    return res.status(500).send('Server misconfiguration');
  }
  const stripe = new Stripe(STRIPE_SECRET_KEY);

  const { session_id } = req.query;
  if (!session_id) return res.status(400).send('Missing session_id');

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    let email = (session && session.customer_details && session.customer_details.email) || session.customer_email || '';

    if (!email && session && session.customer) {
      try {
        const cust = await stripe.customers.retrieve(session.customer);
        if (cust && cust.email) email = cust.email;
      } catch (custErr) {
        console.warn('[session-from-checkout] customer lookup failed', custErr && custErr.message ? custErr.message : custErr);
      }
    }

    console.info('[session-from-checkout] session=', session_id, 'email=', email ? '[REDACTED]' : '(none)');

    // Set host-only cookie (no Domain)
    const cookieValue = encodeURIComponent(email || '');
    const maxAge = 60 * 60 * 24 * 365;
    const cookie = `nh_user_email=${cookieValue}; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`;
    res.setHeader('Set-Cookie', cookie);

    res.writeHead(302, { Location: '/' });
    return res.end();
  } catch (err) {
    console.error('[session-from-checkout] error', err && err.message ? err.message : err);
    return res.status(500).send('Error retrieving checkout session');
  }
}
