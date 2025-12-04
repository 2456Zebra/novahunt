// pages/api/set-password-by-email.js
// Robust set-password endpoint that:
// - First attempts to find an existing Supabase user by email and update its password using the Admin API,
//   trying multiple possible id fields if necessary (id, user_id, aud, sub, etc).
// - If no existing user, verifies payment (prefers session_id if provided), then creates a Supabase user.
// - Returns clear diagnostics and logs helpful details for debugging if the user object shape is unexpected.
//
// IMPORTANT: Deploy this file and then run a test (enter the email you used in checkout on the Success page).
import Stripe from 'stripe';

function pickUserId(user) {
  if (!user || typeof user !== 'object') return null;
  // common fields
  const candidates = ['id', 'user_id', 'userId', 'uid', 'aud', 'sub'];
  for (const k of candidates) {
    if (user[k]) return user[k];
  }
  // fallback: any property with 'id' in the name
  for (const key of Object.keys(user)) {
    if (/id$/i.test(key) && user[key]) return user[key];
    if (/id/i.test(key) && user[key] && String(user[key]).length >= 6) return user[key];
  }
  // nested shapes (e.g., { user: { id: '...' } })
  for (const key of Object.keys(user)) {
    const v = user[key];
    if (v && typeof v === 'object') {
      for (const k2 of ['id', 'user_id', 'uid', 'aud', 'sub']) {
        if (v[k2]) return v[k2];
      }
    }
  }
  return null;
}

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
    console.error('Missing Supabase env vars', { NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY });
    return res.status(500).json({ error: 'Missing server configuration: SUPABASE env vars' });
  }

  const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2022-11-15' }) : null;
  const emailLower = String(email).trim().toLowerCase();

  try {
    // 1) Check existing Supabase user by email
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
      let users = null;
      try { users = JSON.parse(listText); } catch (e) { users = null; }

      if (listResp.ok) {
        // Supabase may return an array or an object. Normalize:
        const first = Array.isArray(users) ? (users.length > 0 ? users[0] : null) : (users && Object.keys(users).length ? users : null);

        if (first) {
          const userId = pickUserId(first);
          if (!userId) {
            console.error('Existing user found but id not discovered by pickUserId', { email: emailLower, sampleUser: first });
            // Return the raw user to help debugging (safe because this endpoint is internal)
            return res.status(500).json({ error: 'Existing user found but id not found', detail: { sampleUser: first } });
          }

          // Update password via Admin API
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
            console.log(`Updated Supabase password for existing user ${emailLower} (id=${userId})`);
            return res.status(200).json({ ok: true, message: 'Password updated for existing account. Sign in now.' });
          } else {
            console.error('Failed updating existing Supabase user', updateResp.status, updateText);
            return res.status(500).json({ error: 'Failed to update existing user password', detail: updateText });
          }
        }
      } else {
        // Non-ok listing: log and continue to create path
        console.warn('Supabase list users non-ok', listResp.status, listText);
      }
    } catch (e) {
      console.warn('Error while checking existing Supabase user (non-fatal)', e?.message || e);
    }

    // 2) No existing user found -> verify payment then create
    let okPayment = false;

    if (stripe && session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ['payment_intent', 'customer', 'subscription'] });
        const sessionEmail = (session.customer_details?.email || session.customer_email || '').toLowerCase();
        const paymentSucceeded =
          session.payment_status === 'paid' ||
          (session.payment_intent && session.payment_intent.status === 'succeeded') ||
          (session.subscription && session.subscription.status === 'active');

        if (!paymentSucceeded) {
          return res.status(403).json({ error: 'Checkout session not marked as paid', detail: { session_id, session_payment_status: session.payment_status } });
        }

        if (!sessionEmail || sessionEmail !== emailLower) {
          return res.status(403).json({ error: 'Email mismatch with checkout session', detail: { provided_email: emailLower, session_email: sessionEmail } });
        }

        okPayment = true;
      } catch (e) {
        console.warn('Stripe session verification error', e?.message || e);
        return res.status(500).json({ error: 'Error verifying Stripe session', detail: String(e?.message || e) });
      }
    } else if (stripe) {
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
        console.warn('Stripe verification error (non-fatal)', e?.message || e);
        // treat as blocking to avoid accidental user creation without payment
      }
    } else {
      okPayment = true; // No Stripe configured -> allow (change if you want)
    }

    if (stripe && !okPayment) {
      return res.status(403).json({ error: 'No active paid subscription or paid invoice found for this email' });
    }

    // Create the user via Supabase Admin API
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

    // If email exists or conflict, attempt lookup+update as last resort
    let createJson = null;
    try { createJson = JSON.parse(createText); } catch (e) { createJson = null; }

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
        console.error('Failed to list Supabase users after create conflict', listResp2.status, listText2);
        return res.status(500).json({ error: 'User exists but could not be looked up', detail: listText2 });
      }

      let users2 = null;
      try { users2 = JSON.parse(listText2); } catch (e) { users2 = null; }
      const first2 = Array.isArray(users2) ? (users2.length > 0 ? users2[0] : null) : (users2 && Object.keys(users2).length ? users2 : null);
      if (!first2) {
        console.error('No user returned after create conflict', users2);
        return res.status(500).json({ error: 'User exists but id not found after create conflict', detail: listText2 });
      }

      const userId2 = pickUserId(first2);
      if (!userId2) {
        console.error('Could not determine user id after create conflict', first2);
        return res.status(500).json({ error: 'User exists but id not found after create conflict', detail: { sampleUser: first2 } });
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
  } catch (err) {
    console.error('General error in set-password-by-email', err);
    return res.status(500).json({ error: 'Internal error', detail: err.message || String(err) });
  }
}
