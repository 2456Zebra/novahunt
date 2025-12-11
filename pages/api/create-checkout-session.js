import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, priceId } = req.body; // Add priceId if not hard-coded

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', // or 'subscription'
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: priceId || 'price_1DefaultPriceHere', quantity: 1 }],
      success_url: `${req.headers.origin}/set-password?email=${encodeURIComponent(email)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/signup`,
    });

    res.status(200).json({ url: session.url, id: session.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
