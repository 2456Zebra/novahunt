import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  try {
    const { email, password, session_id } = req.body || {};
    if (!email || !password) return res.status(400).send('Missing email or password');

    // Optional: verify Stripe checkout session_id if provided
    if (session_id) {
      try {
        const s = await stripe.checkout.sessions.retrieve(session_id);
        if (s && s.customer_email && s.customer_email !== email) {
          return res.status(400).send('Stripe session email mismatch');
        }
      } catch (err) {
        // Continue for preview/testing; in production you can fail here if desired.
        console.warn('Stripe session verify failed', err?.message);
      }
    }

    // Create user via Supabase admin (service role).
    try {
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
    } catch (err) {
      // If user already exists, ignore; otherwise return error.
      if (!/already exists/i.test(err?.message || '')) {
        console.error('Supabase createUser error', err);
        return res.status(500).send('Failed to create user');
      }
    }

    // Success
    return res.status(200).send('OK');
  } catch (err) {
    console.error('set-password API error', err);
    return res.status(500).send('Internal error');
  }
}
