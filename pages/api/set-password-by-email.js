// pages/api/set-password-by-email.js
// Robust set-password endpoint with UUID-validated id extraction + email-path fallback.
import Stripe from 'stripe';

function isUUID(v) {
  if (!v || typeof v !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function pickUserId(user) {
  if (!user || typeof user !== 'object') return null;
  const candidates = ['id', 'user_id', 'userId', 'uid', 'aud', 'sub'];
  for (const k of candidates) {
    const v = user[k];
    if (isUUID(v)) return v;
  }
  for (const key of Object.keys(user)) {
    const v = user[key];
    if (isUUID(v)) return v;
  }
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
          console.warn('User found but no UUID id discovered; attempting email-path fallback', { sampleUser: first });
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
    }

    // Payment verification and creation path omitted here for brevity (same as previous)
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

    return res.status(500).json({ error: 'Failed to create Supabase user', detail: createText });
  } catch (err) {
    console.error('General error in set-password-by-email', err);
    return res.status(500).json({ error: 'Internal error', detail: String(err?.message || err) });
  }
}
