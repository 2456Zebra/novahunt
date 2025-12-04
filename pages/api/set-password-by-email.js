// pages/api/set-password-by-email.js
// POST { email, password, session_id? }
// Preferred verification order:
// 1) If Supabase user exists already -> update password (handles webhook-created users).
// 2) If not, if session_id provided -> retrieve session and verify payment + that session email matches provided email.
// 3) Else fallback to Stripe customer/subscription or paid-invoice check by email.
// 4) If verified, create Supabase user (or update if race conditions produce email_exists).
import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, password, session_id } = req.body || {};
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
    const emailLower = String(email).trim().toLowerCase();

    // 0) Check if Supabase user already exists. If yes, update password and finish.
    try {
      const listUrl = `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(emailLower)}`;
      const listResp = await fetch(listUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceRole}`,
          apikey: serviceRole,
        },
      });

      const listText = await listResp.text();
      if (listResp.ok) {
        let users = null;
        try { users = JSON.parse(listText); } catch { users = null; }
        if (Array.isArray(users) && users.length > 0) {
          const user = users[0];
          const userId = user?.id || user?.user_id || user?.aud;
          if (!userId) {
            console.error('Existing user found but no id', users);
            return res.status(500).json({ error: 'Existing user found but id not available', detail: listText });
          }

          // Update password for existing user
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
            console.log(`Updated password for existing user ${emailLower} (id=${userId})`);
            return res.status(200).json({ ok: true, message: 'Password updated for existing account. Sign in now.' });
          } else {
            console.error('Failed updating existing user password', updateResp.status, updateText);
            return res.status(500).json({ error: 'Failed to update existing user password', detail: updateText });
          }
        }
      } else {
        console.warn('Supabase list users non-ok', listResp.status, listText);
      }
    } catch (e) {
      console.warn('Error checking existing Supabase user (non-fatal)', e?.message || e);
      // Continue to verification/creation path
    }

    // 1) Verify payment: prefer session_id if provided
    let okPayment = false;
    if (stripe && session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(session_id, {
          expand: ['payment_intent', 'customer', 'subscription', 'line_items.data.price.product'],
        });

        // Determine email on session
        const sessionEmail = (session.customer_details?.email || session.customer_email || (session.customer && session.customer.email) || '').toLowerCase();

        // Payment verification heuristics for checkout session:
        const paymentSucceeded =
          session.payment_status === 'paid' ||
          (session.payment_intent && session.payment_intent.status === 'succeeded') ||
          (session.subscription && session.subscription.status === 'active');

        if (!paymentSucceeded) {
          return res.status(403).json({ error: 'Checkout session not marked as paid', detail: { session_id, session_payment_status: session.payment_status, payment_intent_status: session.payment_intent?.status, subscription_status: session.subscription?.status } });
        }

        // Ensure the session's email matches the provided email
        if (!sessionEmail || sessionEmail !== emailLower) {
          return res.status(403).json({
            error: 'Email mismatch with checkout session',
            detail: {
              provided_email: emailLower,
              session_id,
              session_email: sessionEmail || null,
              message: 'Use the exact email shown on the Stripe receipt (session), or paste the session_id to verify.',
            },
          });
        }

        okPayment = true;
      } catch (e) {
        console.warn('Stripe session check error', e?.message || e);
        return res.status(500).json({ error: 'Error verifying Stripe session', detail: String(e?.message || e) });
      }
    } else if (stripe) {
      // fallback: search Stripe customers by email and check active subscription or paid invoice
      try {
        const customers = await stripe.customers.list({ email: emailLower, limit: 1 });
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
        console.warn('Stripe customer/email check error (non-fatal)', e?.message || e);
        // Treat Stripe failure as blocking to avoid accidental account creation without payment;
        // if you prefer to allow creation on Stripe failures, change this to set okPayment=true.
      }
    } else {
      // No Stripe configured — allow creation (or block if you prefer)
      okPayment = true;
    }

    if (stripe && !okPayment) {
      return res.status(403).json({ error: 'No active paid subscription or paid invoice found for this email' });
    }

    // 2) Create the Supabase user
    try {
      const createResp = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceRole}`,
          apikey: serviceRole,
        },
        body: JSON.stringify({
          email: emailLower,
          password,
          email_confirm: true,
          user_metadata: { created_from: 'stripe_success_set_password', session_id: session_id || null },
        }),
      });

      const createText = await createResp.text();
      if (createResp.ok) {
        console.log(`Created Supabase user ${emailLower}`);
        return res.status(200).json({ ok: true, message: 'Account created and password set. Sign in now.' });
      }

      // If create returned email exists (422/email_exists or 409), try update path (race condition)
      let createJson = null;
      try { createJson = JSON.parse(createText); } catch { createJson = null; }

      const isEmailExists =
        createResp.status === 409 ||
        createResp.status === 422 ||
        (createJson && (createJson.error_code === 'email_exists' || createJson.code === 422 || /already been registered/i.test(String(createJson.msg || createJson.error || createText))));

      if (isEmailExists) {
        console.warn('Create returned email exists; attempting lookup+update', createResp.status, createText);

        const listUrl2 = `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(emailLower)}`;
        const listResp2 = await fetch(listUrl2, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${serviceRole}`,
            apikey: serviceRole,
          },
        });

        const listText2 = await listResp2.text();
        if (!listResp2.ok) {
          console.error('Failed to list users after create conflict', listResp2.status, listText2);
          return res.status(500).json({ error: 'User exists but could not be looked up', detail: listText2 });
        }

        let users2 = null;
        try { users2 = JSON.parse(listText2); } catch { users2 = null; }

        let userId2 = null;
        if (Array.isArray(users2) && users2.length > 0) {
          userId2 = users2[0].id || users2[0].user_id || users2[0].aud || null;
        } else if (users2 && (users2.id || users2.user_id)) {
          userId2 = users2.id || users2.user_id;
        }

        if (!userId2) {
          console.error('Could not determine user id after create conflict', users2);
          return res.status(500).json({ error: 'User exists but id not found after create conflict', detail: listText2 });
        }

        const updateResp2 = await fetch(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId2)}`, {
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

        const updateText2 = await updateResp2.text();
        if (updateResp2.ok) {
          console.log(`Updated password for user after create conflict ${emailLower} (id=${userId2})`);
          return res.status(200).json({ ok: true, message: 'Password updated for existing account. Sign in now.' });
        } else {
          console.error('Failed to update after create conflict', updateResp2.status, updateText2);
          return res.status(500).json({ error: 'Failed to update existing user password after create conflict', detail: updateText2 });
        }
      }

      console.error('Supabase create user returned non-OK', createResp.status, createText);
      return res.status(500).json({ error: 'Failed to create Supabase user', detail: createText });
    } catch (e) {
      console.error('Error creating Supabase user:', e);
      return res.status(500).json({ error: 'Error creating Supabase user', detail: e.message || String(e) });
    }
  } catch (err) {
    console.error('General error in set-password-by-email', err);
    return res.status(500).json({ error: 'Internal error', detail: err.message || String(err) });
  }
}
