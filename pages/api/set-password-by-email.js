// pages/api/set-password-by-email.js
// POST { email, password }
// Verifies the email has a paid Stripe customer/subscription (if STRIPE_SECRET_KEY present),
// then creates a Supabase user with the provided password (using service role).
// If Supabase returns that the email already exists (409 or 422/email_exists), this endpoint
// looks up the user and updates their password via the Supabase Admin API.
import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    console.error('Missing SUPABASE env vars for set-password-by-email');
    return res.status(500).json({ error: 'Missing server configuration' });
  }

  const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2022-11-15' }) : null;

  try {
    // Stripe verification (if configured)
    let okPayment = false;
    if (stripe) {
      try {
        const customers = await stripe.customers.list({ email, limit: 1 });
        if (customers?.data?.length) {
          const customer = customers.data[0];
          const subs = await stripe.subscriptions.list({ customer: customer.id, status: 'active', limit: 1 });
          okPayment = !!(subs?.data && subs.data.length > 0);

          if (!okPayment) {
            const invoices = await stripe.invoices.list({ customer: customer.id, limit: 5 });
            okPayment = invoices?.data?.some(inv => inv.status === 'paid' || inv.paid === true) || false;
          }
        } else {
          okPayment = false;
        }
      } catch (e) {
        console.warn('Stripe verification error (non-fatal):', e?.message || e);
        // allow continuation if Stripe is misconfigured; we won't block creation on Stripe error here
      }
    }

    // If Stripe is configured and indicates no paid activity, block
    if (stripe && !okPayment) {
      return res.status(403).json({ error: 'No active paid subscription or paid invoice found for this email' });
    }

    // Attempt to create the user via Supabase Admin API
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

    const createText = await createResp.text();
    let createJson = null;
    try { createJson = JSON.parse(createText); } catch (e) { /* ignore */ }

    if (createResp.ok) {
      console.log(`Set-password: created user ${email}`);
      return res.status(200).json({ ok: true, message: 'Account created and password set. Sign in now.' });
    }

    // If Supabase reports the user already exists (409) OR 422 email_exists, treat as "existing user" and update password
    const isEmailExists =
      createResp.status === 409 ||
      createResp.status === 422 ||
      (createJson && (createJson.error_code === 'email_exists' || createJson.code === 422 || /already been registered/i.test(String(createJson.msg || createJson.error || createText))));

    if (isEmailExists) {
      console.warn('Supabase create user returned existing-user error:', createResp.status, createText);

      // Lookup user by email to get their id
      const listUrl = `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`;
      const listResp = await fetch(listUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceRole}`,
          apikey: serviceRole,
        },
      });

      const listText = await listResp.text();
      if (!listResp.ok) {
        console.error('Failed to list Supabase users by email', listResp.status, listText);
        return res.status(500).json({ error: 'User exists but could not be looked up', detail: listText });
      }

      let users = null;
      try { users = JSON.parse(listText); } catch (e) { users = null; }

      let userId = null;
      if (Array.isArray(users) && users.length > 0) {
        userId = users[0].id || users[0].user_id || users[0].aud || null;
      } else if (users && (users.id || users.user_id)) {
        userId = users.id || users.user_id;
      }

      if (!userId) {
        console.error('Could not determine user id from Supabase list response', users);
        return res.status(500).json({ error: 'User exists but id not found', detail: listText });
      }

      // Attempt to update the existing user's password
      const updateResp = await fetch(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceRole}`,
          apikey: serviceRole,
        },
        body: JSON.stringify({
          password,
          email_confirm: true,
          user_metadata: { updated_from: 'set-password-by-email' },
        }),
      });

      const updateText = await updateResp.text();
      if (updateResp.ok) {
        console.log(`Set-password: updated password for existing user ${email} (id=${userId})`);
        return res.status(200).json({ ok: true, message: 'Password updated for existing account. Sign in now.' });
      } else {
        console.error('Failed to update Supabase user password', updateResp.status, updateText);
        return res.status(500).json({ error: 'Failed to update existing user password', detail: updateText });
      }
    }

    // Any other non-OK create response
    console.error('Supabase create user returned', createResp.status, createText);
    return res.status(500).json({ error: 'Failed to create Supabase user', detail: createText });
  } catch (err) {
    console.error('General error in set-password-by-email', err);
    return res.status(500).json({ error: 'Internal error', detail: err.message || String(err) });
  }
}
