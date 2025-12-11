// pages/api/unsubscribe.js
import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY' });

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Missing email in request body' });

  const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' });

  try {
    // find customer by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (!customers.data || customers.data.length === 0) {
      return res.status(404).json({ error: 'No Stripe customer found for this email' });
    }
    const customer = customers.data[0];

    // list subscriptions for the customer
    const subs = await stripe.subscriptions.list({ customer: customer.id, status: 'all', limit: 100 });

    if (!subs.data || subs.data.length === 0) {
      return res.status(200).json({ ok: true, message: 'No subscriptions found' });
    }

    // cancel each subscription immediately
    const cancelled = [];
    for (const s of subs.data) {
      try {
        const canceled = await stripe.subscriptions.del(s.id);
        cancelled.push({ id: s.id, status: canceled.status });
      } catch (e) {
        console.warn('Failed to cancel subscription', s.id, e.message);
      }
    }

    return res.status(200).json({ ok: true, cancelled });
  } catch (err) {
    console.error('unsubscribe error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
