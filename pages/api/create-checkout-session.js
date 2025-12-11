import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, priceId } = req.body;

  if (!priceId) return res.status(400).json({ error: 'Missing priceId' });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email || undefined, // works even if email is empty
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.origin}/set-password?email=${email ? encodeURIComponent(email) : '{CHECKOUT_SESSION_CLIENT_REFERENCE_ID}'}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/pricing`,
      client_reference_id: email || undefined,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
}
