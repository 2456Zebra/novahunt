import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email } = req.body;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [{ price: 'price_1YOUR_PRICE_ID', quantity: 1 }], // ← change to your real price
    success_url: `${req.headers.origin}/set-password?email=${encodeURIComponent(email)}`,
    cancel_url: `${req.headers.origin}/pricing`,
  });

  res.json({ url: session.url });
}
