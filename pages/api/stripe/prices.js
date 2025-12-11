import stripe from '../../../lib/stripe';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
      limit: 100,
    });

    const items = prices.data.map((p) => ({
      id: p.id,
      unit_amount: p.unit_amount,
      currency: p.currency,
      nickname: p.nickname || null,
      recurring: p.recurring || null,
      product: p.product
        ? {
            id: p.product.id,
            name: p.product.name,
            description: p.product.description || null,
            active: p.product.active,
          }
        : null,
    }));

    return res.status(200).json({ prices: items });
  } catch (err) {
    console.error('Error listing Stripe prices', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
