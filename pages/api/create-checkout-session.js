import stripe from '../../lib/stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const body = req.body || {};
    const { priceId, line_items } = body;
    const lineItems = line_items || (priceId ? [{ price: priceId, quantity: 1 }] : null);

    if (!lineItems) {
      return res.status(400).json({ error: 'Missing priceId' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/cancel`,
    });

    return res.status(200).json({ id: session.id });
  } catch (err) {
    console.error('create-checkout-session error', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
