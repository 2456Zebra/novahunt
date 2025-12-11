import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, priceId } = req.body;

  if (!priceId) return res.status(400).json({ error: 'Price ID required' });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', // or 'subscription' if recurring
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: `${req.headers.origin}/set-password?email=${encodeURIComponent(email)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/pricing`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
