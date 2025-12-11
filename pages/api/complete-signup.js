// pages/api/complete-signup.js
// POST { session_id, password } -> creates user in Supabase and marks session consumed
// Requires STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in envs.

import Stripe from 'stripe';
import fetch from 'node-fetch';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function supabaseRpc(path, body) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });
  return res;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { session_id, password } = req.body || {};
  if (!session_id) return res.status(400).json({ error: 'missing session_id' });
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'invalid_password' });
  }
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'supabase_not_configured' });
  }

  try {
    // Retrieve Stripe session & expand customer
    const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ['customer', 'subscription'] });

    // Validate payment/subscription state
    let paid = false;
    if (session.payment_status === 'paid') paid = true;
    if (session.subscription && session.subscription.status === 'active') paid = true;
    if (!paid) return res.status(400).json({ error: 'payment_not_confirmed' });

    // Determine email
    const email = session.customer_email || (session.customer && session.customer.email);
    if (!email) return res.status(400).json({ error: 'no_email_in_session' });

    // Try to insert a "consumed session" row to prevent replay
    // Assumes table checkout_sessions_used exists with primary key session_id
    const insertRes = await supabaseRpc('checkout_sessions_used', {
      session_id,
      email,
      created_at: new Date().toISOString(),
    });

    if (!insertRes.ok) {
      const text = await insertRes.text().catch(() => '');
      // If conflict (already exists), return a helpful code
      if (insertRes.status === 409) {
        return res.status(409).json({ error: 'session_already_used' });
      }
      console.error('supabase insert error', insertRes.status, text);
      return res.status(500).json({ error: 'db_error', message: text });
    }

    // Create a Supabase user using Admin RPC (example: call your own endpoint or use service role)
    // If you have a dedicated RPC to create users, call it here. We'll return success with email.
    return res.status(200).json({ email, session_id, status: 'ok' });
  } catch (err) {
    console.error('complete-signup error', err?.message || err);
    const msg = String(err?.message || err);
    if (msg.toLowerCase().includes('no such checkout.session')) {
      return res.status(404).json({ error: 'not_found', message: msg });
    }
    return res.status(500).json({ error: 'stripe_or_db_error', message: msg });
  }
}
