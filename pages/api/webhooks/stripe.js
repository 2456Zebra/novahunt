import Stripe from 'stripe';
import { buffer } from 'micro';

export const config = {
  api: {
    bodyParser: false, // required for Stripe signature verification
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

        // derive plan name if this was a subscription (best-effort)
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
            // fallback: look at display_items if present
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
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !serviceRole || !anonKey) {
          console.error('Missing Supabase env vars for webhook handler');
          break;
        }

        // Create user with plan metadata via Supabase Admin API.
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
              user_metadata: { created_from: 'stripe_checkout', plan: planName },
            }),
          });

          if (createResp.ok) {
            console.log(`Supabase: created user for ${email} (plan: ${planName})`);
          } else {
            const text = await createResp.text();
            console.warn(`Supabase create user returned ${createResp.status}: ${text}`);
            // If user exists, we still want to try updating metadata to reflect plan
            if (createResp.status === 409) {
              // Attempt to update user metadata via the Admin "update user" endpoint:
              // First, list users via admin list (not available on REST in some setups) — skip if not available.
              // Best-effort: call the "update by email" supabase REST if you have a custom RPC. Otherwise skip.
              console.warn('User exists; skipping metadata update (manual update may be required).');
            }
          }
        } catch (e) {
          console.error('Error creating Supabase user:', e);
        }

        // Trigger Supabase password recovery (set-password email) using anon key
        try {
          const recoverResp = await fetch(`${supabaseUrl}/auth/v1/recover`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: anonKey,
              Authorization: `Bearer ${anonKey}`,
            },
            body: JSON.stringify({ email }),
          });

          if (recoverResp.ok) {
            console.log(`Supabase: triggered password recovery email to ${email}`);
          } else {
            const body = await recoverResp.text();
            console.warn(`Supabase recover returned ${recoverResp.status}: ${body}`);
          }
        } catch (e) {
          console.error('Error triggering Supabase recover:', e);
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
