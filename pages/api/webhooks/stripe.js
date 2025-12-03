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
        // prefer customer_details.email if present (newer API)
        const email = session.customer_details?.email || session.customer_email;
        if (!email) {
          console.warn('checkout.session.completed has no email:', session);
          break;
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '');
        const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !serviceRole || !anonKey) {
          console.error('Missing Supabase env vars for webhook handler');
          break;
        }

        // 1) Create the user via Supabase Admin endpoint (idempotent-ish: if user exists, we'll handle it)
        const createResp = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${serviceRole}`,
            apikey: serviceRole, // supabase accepts apikey header too; include both for compatibility
          },
          body: JSON.stringify({
            email,
            // do not set password here; we'll send recovery email so they set their own
            email_confirm: true,
            user_metadata: { created_from: 'stripe_checkout' },
          }),
        });

        if (createResp.ok) {
          console.log(`Supabase: created user for ${email}`);
        } else {
          const text = await createResp.text();
          // If user already exists, Supabase may return 409 or other; log and continue
          console.warn(`Supabase create user returned status ${createResp.status}: ${text}`);
        }

        // 2) Trigger Supabase password recovery (this sends the "set password" email)
        //    The recover endpoint can be called using the anon key.
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

        break;
      }

      default:
        // ignore other events
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 to Stripe
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error handling Stripe webhook:', err);
    res.status(500).send('Webhook handler error');
  }
}
