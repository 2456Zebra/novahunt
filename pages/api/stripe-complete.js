import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

export default async function handler(req, res) {
  const sessionId = req.query.session_id;
  if (!sessionId) {
    return res.status(400).json({ ok: false, error: 'Missing session_id' });
  }

  try {
    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription', 'line_items']
    });

    // Example: basic validation — you may want to verify payment status or subscription status
    // Then create or update your user account / session as appropriate.
    // Replace the following with your app's sign-in/create-user logic.
    const email = checkoutSession.customer_details && checkoutSession.customer_details.email;
    const subscription = checkoutSession.subscription || null;

    // TODO: create or link a user session here and return a session token/cookie
    // For now we return the checkout payload so the client can show a user-friendly message.
    return res.status(200).json({
      ok: true,
      checkout: {
        id: checkoutSession.id,
        email,
        subscription,
        payment_status: checkoutSession.payment_status,
        amount_total: checkoutSession.amount_total
      }
    });
  } catch (err) {
    console.error('stripe-complete error', err && (err.message || err));
    return res.status(500).json({ ok: false, error: 'Could not retrieve checkout session' });
  }
}
