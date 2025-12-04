// pages/api/set-password-by-email.js
// Robust set-password endpoint with UUID-validated id extraction + email-path fallback.
// Replace the existing file with this, redeploy, and run the test command shown below.
import Stripe from 'stripe';

function isUUID(v) {
  if (!v || typeof v !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function pickUserId(user) {
  if (!user || typeof user !== 'object') return null;
  // prefer canonical fields but only return if they are valid UUIDs
  const candidates = ['id', 'user_id', 'userId', 'uid', 'aud', 'sub'];
  for (const k of candidates) {
    const v = user[k];
    if (isUUID(v)) return v;
  }
  // fallback: any property with 'id' in the name that is a UUID
  for (const key of Object.keys(user)) {
    const v = user[key];
    if (isUUID(v)) return v;
  }
  // nested shapes (e.g., { user: { id: '...' } })
  for (const key of Object.keys(user)) {
    const v = user[key];
    if (v && typeof v === 'object') {
      for (const k2 of ['id', 'user_id', 'uid', 'aud', 'sub']) {
        if (isUUID(v[k2])) return v[k2];
      }
    }
  }
  return null;
}

async function supabaseAdminFetch(url, options = {}) {
  return await fetch(url, options);
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
    console.error('Missing SUPABASE env vars', { NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY });
    return res.status(500).json({ error: 'Missing server configuration: SUPABASE env vars' });
  }

  const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2022-11-15' }) : null;
  const emailLower = String(email).trim().toLowerCase();

  try {
    // 1) Try to find existing user
    const listUrl = `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(emailLower)}`;
    const listResp = await supabaseAdminFetch(listUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceRole}`, apikey: serviceRole },
    });

    const listText = await listResp.text();
    let users = null;
    try { users = JSON.parse(listText); } catch (e) { users = null; }

    if (listResp.ok) {
      const first = Array.isArray(users) ? (users.length ? users[0] : null) : (users && Object.keys(users).length ? users : null);
      if (first) {
        const userId = pickUserId(first);
        if (userId) {
          // Update by discovered id (guaranteed UUID)
          const updateResp = await supabaseAdminFetch(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceRole}`, apikey: serviceRole },
            body: JSON.stringify({ password, email_confirm: true, user_metadata: { updated_from: 'set-password-by-email' } }),
          });
          const updateText = await updateResp.text();
          if (updateResp.ok) {
            console.log(`Updated Supabase password for ${emailLower} (id=${userId})`);
            return res.status(200).json({ ok: true, message: 'Password updated for existing account. Sign in now.' });
          } else {
            console.error('Failed updating existing user by id', updateResp.status, updateText);
            return res.status(500).json({ error: 'Failed to update existing user password', detail: updateText });
          }
        } else {
          // ID not discovered OR not a UUID -> try email-path fallback (some installs accept PUT /admin/users/<email>)
          console.warn('User found but no UUID id discovered; returning sampleUser for diagnostics and attempting email-path fallback', { sampleUser: first });
          const fallbackUrl = `${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(emailLower)}`;
          try {
            const fallbackResp = await supabaseAdminFetch(fallbackUrl, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceRole}`, apikey: serviceRole },
              body: JSON.stringify({ password, email_confirm: true, user_metadata: { updated_from: 'set-password-by-email-fallback' } }),
            });
            const fallbackText = await fallbackResp.text();
            if (fallbackResp.ok) {
              console.log(`Fallback updated Supabase user via email path for ${emailLower}`);
              return res.status(200).json({ ok: true, message: 'Password updated (fallback) for existing account. Sign in now.' });
            } else {
              console.error('Fallback update failed; returning sampleUser for diagnostics', { fallbackStatus: fallbackResp.status, fallbackText, sampleUser: first });
              return res.status(500).json({ error: 'Existing user found but id not found', detail: { sampleUser: first, fallbackStatus: fallbackResp.status, fallbackText } });
            }
          } catch (e) {
            console.error('Fallback update attempt threw', e?.message || e, { sampleUser: first });
            return res.status(500).json({ error: 'Existing user found but id not found', detail: { sampleUser: first, fallbackError: String(e?.message || e) } });
          }
        }
      }
    } else {
      console.warn('Supabase admin list returned non-ok', listResp.status, listText);
      // continue to create path below
    }

    // 2) No existing user -> verify payment then create user
    let okPayment = false;
    if (stripe && session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ['payment_intent', 'customer', 'subscription'] });
        const sessionEmail = (session.customer_details?.email || session.customer_email || '').toLowerCase();
        const paymentSucceeded = session.payment_status === 'paid' || (session.payment_intent && session.payment_intent.status === 'succeeded') || (session.subscription && session.subscription.status === 'active');
        if (!paymentSucceeded) return res.status(403).json({ error: 'Checkout session not marked as paid', detail: { session_id, payment_status: session.payment_status } });
        if (!sessionEmail || sessionEmail !== emailLower) return res.status(403).json({ error: 'Email mismatch with checkout session', detail: { provided_email: emailLower, session_email: sessionEmail } });
        okPayment = true;
      } catch (e) { console.warn('Stripe session verify error', e?.message || e); return res.status(500).json({ error: 'Error verifying Stripe session', detail: String(e?.message || e) }); }
    } else if (stripe) {
      try {
        const customers = await stripe.customers.list({ email: emailLower, limit: 1 });
        if (customers?.data?.length) {
          const customer = customers.data[0];
          const subs = await stripe.subscriptions.list({ customer: customer.id, status: 'active', limit: 1 });
          okPayment = !!(subs?.data?.length);
          if (!okPayment) {
            const invoices = await stripe.invoices.list({ customer: customer.id, limit: 5 });
            okPayment = invoices?.data?.some(inv => inv.status === 'paid' || inv.paid === true) || false;
          }
        } else okPayment = false;
      } catch (e) { console.warn('Stripe email verify error', e?.message || e); }
    } else okPayment = true;

    if (stripe && !okPayment) return res.status(403).json({ error: 'No active paid subscription or paid invoice found for this email' });

    // Create user
    const createResp = await supabaseAdminFetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceRole}`, apikey: serviceRole },
      body: JSON.stringify({ email: emailLower, password, email_confirm: true, user_metadata: { created_from: 'stripe_success_set_password', session_id: session_id || null } }),
    });

    const createText = await createResp.text();
    if (createResp.ok) {
      console.log(`Created Supabase user ${emailLower}`);
      return res.status(200).json({ ok: true, message: 'Account created and password set. Sign in now.' });
    }

    // If create failed due to existing email, try lookup+update again
    let createJson = null;
    try { createJson = JSON.parse(createText); } catch (e) { createJson = null; }

    const isEmailExists = createResp.status === 409 || createResp.status === 422 || (createJson && (createJson.error_code === 'email_exists' || /already been registered/i.test(String(createText))));
    if (isEmailExists) {
      console.warn('Create returned email exists; attempting lookup+update', createResp.status, createText);
      const listResp2 = await supabaseAdminFetch(`${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(emailLower)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceRole}`, apikey: serviceRole },
      });
      const listText2 = await listResp2.text();
      let users2 = null;
      try { users2 = JSON.parse(listText2); } catch (e) { users2 = null; }
      const first2 = Array.isArray(users2) ? (users2.length ? users2[0] : null) : (users2 && Object.keys(users2).length ? users2 : null);
      if (!first2) return res.status(500).json({ error: 'User exists but id not found after create conflict', detail: listText2 });
      const userId2 = pickUserId(first2);
      if (!userId2) return res.status(500).json({ error: 'User exists but id not found after create conflict', detail: { sampleUser: first2 } });
      const updateResp2 = await supabaseAdminFetch(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId2)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceRole}`, apikey: serviceRole },
        body: JSON.stringify({ password, email_confirm: true, user_metadata: { updated_from: 'set-password-by-email' } }),
      });
      const updateText2 = await updateResp2.text();
      if (updateResp2.ok) return res.status(200).json({ ok: true, message: 'Password updated for existing account. Sign in now.' });
      return res.status(500).json({ error: 'Failed to update existing user password after create conflict', detail: updateText2 });
    }

    console.error('Supabase create user returned non-OK', createResp.status, createText);
    return res.status(500).json({ error: 'Failed to create Supabase user', detail: createText });
  } catch (err) {
    console.error('General error in set-password-by-email', err);
    return res.status(500).json({ error: 'Internal error', detail: String(err?.message || err) });
  }
}
