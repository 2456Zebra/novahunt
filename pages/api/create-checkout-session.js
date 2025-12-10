import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { priceId, email } = req.body;
  if (!priceId || !email) return res.status(400).json({ error: 'missing priceId or email' });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription', // or 'payment' if one-time
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      // Use CHECKOUT_SESSION_ID - you'll receive it on the success page and can fetch the session server-side if needed
      success_url: `${process.env.NEXT_PUBLIC_URL}/set-password?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
      client_reference_id: email
    });

    // session.url is the recommended redirect target for Stripe Checkout
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-checkout-session error', err?.message || err);
    return res.status(500).json({ error: err?.message || 'server_error' });
  }
}

export const config = { api: { bodyParser: true } };
