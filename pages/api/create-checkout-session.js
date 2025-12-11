import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body; // Add any other data like priceId if needed

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', // or 'subscription' if needed
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{
        price: 'price_1YourPriceIdHere', // Replace with your real price ID
        quantity: 1,
      }],
      success_url: `${req.headers.origin}/set-password?email=${encodeURIComponent(email)}`,
      cancel_url: `${req.headers.origin}/pricing`, // Or your cancel page
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
