// pages/api/set-password-by-email.js
// POST { email, password }
// Verifies the email has a paid Stripe customer/subscription, then creates a Supabase user with the provided password (using service role).
// If the user already exists (409), this endpoint will attempt to update the existing user's password via the Supabase Admin API.
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

  if (!supabaseUrl || !serviceRole) {
    console.error('Missing SUPABASE env vars for set-password-by-email');
    return res.status(500).json({ error: 'Missing server configuration' });
  }

  const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2022-11-15' }) : null;

  try {
    // If Stripe is configured, prefer verifying payment via Stripe.
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
        // proceed: allow creation if Stripe is not available, or rely on Supabase existence in other flows.
      }
    }

    // If Stripe exists and shows no paid activity, block.
    if (stripe && !okPayment) {
      return res.status(403).json({ error: 'No active paid subscription or paid invoice found for this email' });
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
        console.log(`Set-password: created user ${email}`);
        return res.status(200).json({ ok: true, message: 'Account created and password set. Sign in now.' });
      }

      // If user exists (409) — try to update their password
      if (createResp.status === 409) {
        console.warn('Supabase create user returned 409 (user exists):', text);

        // Look up the user by email to fetch their user id
        try {
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

          const users = await (async () => {
            try { return JSON.parse(listText); } catch { return null; }
          })();

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

          // Update the user password using Admin API (PUT)
          try {
            const updateResp = await fetch(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${serviceRole}`,
                apikey: serviceRole,
              },
              body: JSON.stringify({
                password,
                // keep email_confirm true - don't re-send confirmation
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
          } catch (e) {
            console.error('Error calling Supabase admin update', e);
            return res.status(500).json({ error: 'Error updating existing user', detail: e.message || String(e) });
          }
        } catch (e) {
          console.error('Error handling existing user case', e);
          return res.status(500).json({ error: 'Error handling existing user', detail: e.message || String(e) });
        }
      }

      // Other non-OK responses
      console.error('Supabase create user returned', createResp.status, text);
      return res.status(500).json({ error: 'Failed to create Supabase user', detail: text });
    } catch (e) {
      console.error('Error creating Supabase user:', e);
      return res.status(500).json({ error: 'Error creating Supabase user', detail: e.message || String(e) });
    }
  } catch (err) {
    console.error('General error in set-password-by-email', err);
    return res.status(500).json({ error: 'Internal error', detail: err.message || String(err) });
  }
}
