// Stripe webhook endpoint — validates signature and stores subscription info in Vercel KV.
// Make sure to set STRIPE_WEBHOOK_SECRET in Vercel and configure the Stripe dashboard to send events to:
// https://YOUR_SITE/api/webhook
import Stripe from 'stripe';
import { buffer } from 'micro';
import { kv } from '@vercel/kv';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-11-15' });

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
    // Handle relevant events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        // session.customer_email may exist; metadata.nh_session contains the client-side session
        const email = session.customer_email || (() => {
          try {
            const parsed = JSON.parse(session.metadata?.nh_session || '{}');
            return parsed?.email || null;
          } catch (e) {
            return null;
          }
        })();

        // store checkout -> email as well
        if (email) {
          await kv.set(`stripe:checkout:${session.id}`, { email, created_at: new Date().toISOString() }, { ex: 60 * 60 * 24 * 7 });
        }
        break;
      }

      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        // On subscription events, save subscription info keyed by customer email when available
        const sub = event.data.object; // subscription or invoice depending on event
        // Try to get email: invoice has customer_email on hosted_invoice_url? fallback via customer object lookup
        let email = null;

        if (sub.customer_email) email = sub.customer_email;
        // subscription object sometimes contains customer id — fetch customer to get email
        if (!email && sub.customer) {
          try {
            const customer = await stripe.customers.retrieve(sub.customer);
            email = customer?.email || null;
          } catch (e) {
            console.warn('Could not fetch customer', e);
          }
        }

        // For invoices, look at invoice.customer and fetch email
        if (!email && sub?.customer) {
          try {
            const customer = await stripe.customers.retrieve(sub.customer);
            email = customer?.email || null;
          } catch (e) {
            // ignore
          }
        }

        if (email) {
          // Keep subscription data useful for gating features
          const dataToStore = {
            id: sub.id || sub.subscription || null,
            status: sub.status || 'unknown',
            priceId: (sub.items && sub.items?.data && sub.items.data[0]?.price?.id) || null,
            current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
            raw: sub,
            updated_at: new Date().toISOString(),
          };
          try {
            await kv.set(`stripe:subscription:${email.toLowerCase()}`, dataToStore, { ex: 60 * 60 * 24 * 365 });
          } catch (e) {
            console.warn('KV write error (subscription)', e);
          }
        }
        break;
      }

      default:
        // console.log(`Unhandled event type ${event.type}`);
        break;
    }
  } catch (err) {
    console.error('Error processing webhook', err);
    return res.status(500).send('Webhook handler error');
  }

  res.status(200).send('Received');
}
