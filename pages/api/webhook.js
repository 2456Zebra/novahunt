// Stripe webhook endpoint — validates signature and stores subscription info in KV.
// Make sure to set STRIPE_WEBHOOK_SECRET in Vercel and configure the Stripe dashboard to send events to:
// https://YOUR_SITE/api/webhook
import Stripe from 'stripe';
import { buffer } from 'micro';
import { getKV } from './_kv-wrapper';
const kv = getKV();

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-11-15' });

export default async function handler(req, res) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET');
    return res.status(500).send('Webhook secret not configured');
  }

  let event;
  try {
    const raw = await buffer(req);
    event = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed', err?.message || err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const email = session.customer_email || (() => {
          try {
            const parsed = JSON.parse(session.metadata?.nh_session || '{}');
            return parsed?.email || null;
          } catch (e) {
            return null;
          }
        })();

        if (email && kv) {
          await kv.set(`stripe:checkout:${session.id}`, { email, created_at: new Date().toISOString() }, { ex: 60 * 60 * 24 * 7 });
        }
        break;
      }

      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const obj = event.data.object;
        let email = null;

        if (obj.customer_email) email = obj.customer_email;
        if (!email && obj.customer) {
          try {
            const customer = await stripe.customers.retrieve(obj.customer);
            email = customer?.email || null;
          } catch (e) {
            console.warn('Could not fetch customer', e?.message || e);
          }
        }

        if (email && kv) {
          const dataToStore = {
            id: obj.id || obj.subscription || null,
            status: obj.status || 'unknown',
            priceId: (obj.items && obj.items?.data && obj.items.data[0]?.price?.id) || null,
            current_period_end: obj.current_period_end ? new Date(obj.current_period_end * 1000).toISOString() : null,
            raw: obj,
            updated_at: new Date().toISOString(),
          };
          try {
            await kv.set(`stripe:subscription:${email.toLowerCase()}`, dataToStore, { ex: 60 * 60 * 24 * 365 });
          } catch (e) {
            console.warn('KV write error (subscription)', e?.message || e);
          }
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('Error processing webhook', err?.message || err);
    return res.status(500).send('Webhook handler error');
  }

  res.status(200).send('Received');
}
