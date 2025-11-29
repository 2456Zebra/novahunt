import Stripe from 'stripe';

/*
  TEMPORARY DEBUGGING endpoint.
  - Retrieves Stripe checkout session by session_id.
  - Sets a client cookie nh_user_email (Path=/; Max-Age; SameSite=Lax; Secure).
  - Redirects to / with checkout_email query param so you can confirm the server saw the email.
  IMPORTANT: This exposes the email in the URL for debugging only. Remove/replace with the
  secure version once we've diagnosed the problem.
*/

export default async function handler(req, res) {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    console.error('session-from-checkout: STRIPE_SECRET_KEY missing');
    return res.status(500).send('Server misconfiguration: STRIPE_SECRET_KEY missing');
  }
  const stripe = new Stripe(STRIPE_SECRET_KEY);

  const { session_id } = req.query;
  if (!session_id) return res.status(400).send('Missing session_id query parameter');

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Grab email if present
    const email = session.customer_email || '';

    // Log minimal diagnostics (Vercel logs will show this)
    console.info('session-from-checkout: session_id=', session_id, 'email=', email, 'session_exists=', !!session);

    // Set the client-visible cookie (no Domain attribute so it attaches to current origin)
    const cookieValue = encodeURIComponent(email || '');
    const maxAge = 60 * 60 * 24 * 365; // 1 year
    const cookie = `nh_user_email=${cookieValue}; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`;
    res.setHeader('Set-Cookie', cookie);

    // DEBUG: redirect to homepage including the email as a query param so we can see it in the browser
    // (temporary — remove this after debugging)
    const redirectTo = `/?checkout_email=${encodeURIComponent(email || '')}`;
    res.writeHead(302, { Location: redirectTo });
    return res.end();
  } catch (err) {
    console.error('session-from-checkout error', err && err.message ? err.message : err);
    return res.status(500).send('Error retrieving checkout session');
  }
}
