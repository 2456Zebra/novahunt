// pages/api/session-from-checkout.js
// Lightweight post-checkout redirect handler.
// Usage as Stripe SUCCESS_URL:
//   https://yourdomain.com/api/session-from-checkout?session_id={CHECKOUT_SESSION_ID}
//
// What it does:
// 1) Retrieves the Stripe checkout session.
// 2) Reads session.customer_email (if present).
// 3) Sets a demo cookie nh_user_email so the frontend can show the signed-in email.
// 4) Redirects to homepage (or another URL).
//
// Important: This is a minimal demo/proof-of-concept to make users appear "signed in" after checkout.
// For production you should replace step 3 with real user provisioning and an authenticated session.

import Stripe from 'stripe';

export default async function handler(req, res) {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    return res.status(500).send('Server misconfiguration: STRIPE_SECRET_KEY missing');
  }
  const stripe = new Stripe(STRIPE_SECRET_KEY);

  const { session_id } = req.query;
  if (!session_id) return res.status(400).send('Missing session_id query parameter');

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const email = session.customer_email || '';

    // Set a simple cookie so the frontend can detect the signed-in email (demo-only)
    // Cookie is not secure-signed; replace with your real auth session in production.
    const cookieValue = encodeURIComponent(email);
    // Set cookie for 1 year
    res.setHeader('Set-Cookie', `nh_user_email=${cookieValue}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`);

    // Optional: You can also set an HttpOnly cookie for server-only checks:
    // res.setHeader('Set-Cookie', `nh_session=...; HttpOnly; Path=/; Max-Age=...; SameSite=Lax`);

    // Redirect to homepage where your UI should detect nh_user_email cookie and show email
    res.writeHead(302, { Location: '/' });
    return res.end();
  } catch (err) {
    console.error('session-from-checkout error', err && err.message ? err.message : err);
    return res.status(500).send('Error retrieving checkout session');
  }
}
