// POST { email, password }
// Verifies the email has a paid Stripe customer/subscription, then creates a Supabase user with the provided password (using service role).
import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecret || !supabaseUrl || !serviceRole) {
    return res.status(500).json({ error: 'Missing server configuration' });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' });

  try {
    // find Stripe customer by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (!customers.data || customers.data.length === 0) {
      return res.status(404).json({ error: 'No Stripe customer found for this email' });
    }
    const customer = customers.data[0];

    // check for active paid subscription or a successful invoice
    const subs = await stripe.subscriptions.list({ customer: customer.id, status: 'active', limit: 1 });
    let okPayment = (subs.data && subs.data.length > 0);

    if (!okPayment) {
      // fallback: check invoices paid
      const invoices = await stripe.invoices.list({ customer: customer.id, limit: 3 });
      okPayment = invoices.data.some(inv => inv.status === 'paid');
    }

    if (!okPayment) {
      return res.status(403).json({ error: 'No active paid subscription or invoice found for this email' });
    }

    // Create the user via Supabase Admin API and set the password
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
          password,
          email_confirm: true,
          user_metadata: { created_from: 'stripe_success_set_password' },
        }),
      });

      const text = await createResp.text();
      if (createResp.ok) {
        return res.status(200).json({ ok: true, message: 'Account created and password set. Sign in now.' });
      } else if (createResp.status === 409) {
        // user exists -> prompt to sign in or reset
        return res.status(409).json({ error: 'Account already exists. Please sign in or reset your password.' });
      } else {
        console.warn('Supabase create user returned', createResp.status, text);
        return res.status(500).json({ error: 'Failed to create Supabase user', detail: text });
      }
    } catch (e) {
      console.error('Error creating Supabase user:', e);
      return res.status(500).json({ error: 'Error creating Supabase user' });
    }
  } catch (err) {
    console.error('Stripe lookup error', err);
    return res.status(500).json({ error: 'Stripe lookup error' });
  }
}
