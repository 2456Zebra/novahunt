import Stripe from 'stripe';
import { buffer } from 'micro';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const email = session.customer_details?.email || session.customer_email;
        if (!email) {
          console.warn('checkout.session.completed has no email:', session.id);
          break;
        }

        // Best-effort plan detection
        let planName = 'unknown';
        try {
          const subscriptionId = session.subscription || session.subscription_id;
          if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['items.data.price.product'] });
            const item = subscription.items?.data?.[0];
            if (item?.price) {
              planName = item.price.nickname || (item.price.product && item.price.product.name) || item.price.id;
            }
          } else if (session.display_items && session.display_items.length) {
            const di = session.display_items[0];
            planName = di?.plan?.product?.name || di?.price?.nickname || planName;
          } else if (session.metadata?.plan) {
            planName = session.metadata.plan;
          }
        } catch (e) {
          console.warn('Could not determine plan from Stripe session:', e?.message || e);
        }

        const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
        const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRole) {
          console.error('Missing Supabase env vars for webhook handler');
          break;
        }

        // Create user via Supabase Admin API and mark them as password_pending.
        // IMPORTANT: we do NOT trigger any outgoing email here to avoid bounces.
        try {
          const createResp = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${serviceRole}`,
              apikey: serviceRole,
            },
            body: JSON.stringify({
              email,
              email_confirm: true,
              user_metadata: { created_from: 'stripe_checkout', plan: planName, password_pending: true },
            }),
          });

          if (createResp.ok) {
            console.log(`Supabase: created user for ${email} (plan: ${planName}) — password_pending=true`);
          } else {
            const text = await createResp.text();
            console.warn(`Supabase create user returned ${createResp.status}: ${text}`);
            // If user already exists, consider updating user_metadata to reflect plan/password_pending
            // (left as a manual or next-step improvement)
          }
        } catch (e) {
          console.error('Error creating Supabase user:', e);
        }

        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error handling Stripe webhook:', err);
    return res.status(500).send('Webhook handler error');
  }
}
