// pages/api/webhooks/stripe.js
// Stripe webhook handler: verified and robust Supabase admin create.
// Important: ensure SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are correct in Vercel.
//
// This file logs Supabase admin responses and includes the created user object in logs so we can confirm shape.
import Stripe from 'stripe';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2022-11-15' }) : null;

async function bufferToString(readable) {
  const chunks = [];
  for await (const chunk of readable) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req, res) {
  if (!stripe) {
    console.warn('Stripe not configured for webhook');
    res.status(200).send('no-op');
    return;
  }

  const sig = req.headers['stripe-signature'];
  const body = await bufferToString(req);

  let event;
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      // If no webhook secret configured, attempt to parse body (less secure)
      event = JSON.parse(body);
    }
  } catch (err) {
    console.error('Stripe webhook signature verification failed', err?.message || err);
    return res.status(400).send(`Webhook Error: ${err?.message || err}`);
  }

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'invoice.payment_succeeded' || event.type === 'invoice.payment.paid') {
      const session = event.data.object;
      const customer_email = (session.customer_details?.email || session.customer_email || '').toLowerCase();
      // Create (or ensure) Supabase user via Admin API
      if (!supabaseUrl || !serviceRole) {
        console.error('Missing Supabase admin config in webhook');
      } else {
        try {
          const createResp = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${serviceRole}`,
              apikey: serviceRole,
            },
            body: JSON.stringify({
              email: customer_email,
              password: Math.random().toString(36).slice(-12),
              email_confirm: true,
              user_metadata: { created_from: 'stripe_webhook', stripe_event: event.type },
            }),
          });

          const createText = await createResp.text();
          let createJson = null;
          try { createJson = JSON.parse(createText); } catch (e) { createJson = null; }

          if (createResp.ok) {
            console.log(`Supabase: created user for ${customer_email}`, createJson);
          } else {
            // If Supabase says user exists, log the returned body so we can inspect its shape
            console.warn('Supabase admin create user returned non-ok', createResp.status, createText);
          }
        } catch (e) {
          console.error('Error calling Supabase admin create from webhook', e?.message || e);
        }
      }
    } else {
      console.log('Unhandled Stripe event type:', event.type);
    }

    res.status(200).send('ok');
  } catch (err) {
    console.error('Webhook processing error', err?.message || err);
    res.status(500).send('server error');
  }
}
