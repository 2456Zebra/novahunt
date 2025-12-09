// pages/api/auth/set-password.js
// Server endpoint to finalize a new account's password after Stripe Checkout.
// POST { email, password, token }
// - Verifies the Stripe Checkout session token (if present) and that the session email matches.
// - Uses SUPABASE_SERVICE_ROLE_KEY to create the user if missing or update the user's password if present.
// - Returns 200 on success, suitable for the existing client flow that calls /api/auth/signin afterwards.
//
// Required env:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - STRIPE_SECRET_KEY (recommended; endpoint will validate token if provided)
//
// Notes:
// - This uses Supabase Admin REST endpoints under /auth/v1/admin/users. It requires the service role key.
// - If you don't want token validation, client may call this without token but that's less secure.

import Stripe from 'stripe';

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

function json(res, status, body) {
  res.status(status).json(body);
}

async function stripeValidateToken(token, email) {
  if (!STRIPE_SECRET_KEY) return { ok: true, reason: 'no_stripe_key' }; // skip validation if stripe key not present
  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });
  try {
    const session = await stripe.checkout.sessions.retrieve(token, { expand: ['customer'] });
    const sessionEmail = session.customer_details?.email || session.customer?.email || session.customer_email || null;
    // Accept if session email matches and payment_status indicates paid (or session.status==='complete')
    const paid = session.payment_status === 'paid' || session.status === 'complete' || !!session.amount_total;
    if (!sessionEmail) return { ok: false, reason: 'stripe_no_email' };
    if (sessionEmail.toLowerCase() !== String(email || '').toLowerCase()) return { ok: false, reason: 'email_mismatch' };
    if (!paid) return { ok: false, reason: 'payment_not_completed' };
    return { ok: true, session };
  } catch (err) {
    console.error('stripe validate error', err);
    return { ok: false, reason: 'stripe_error', detail: err?.message || String(err) };
  }
}

async function findUserByEmail(email) {
  // Supabase Admin REST: GET /auth/v1/admin/users?email=<email>
  const url = `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`;
  const headers = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`
  };
  try {
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) {
      // 404 or 400 simply means not found / not accessible
      return { ok: false, status: res.status, body: await res.text().catch(()=>null) };
    }
    const js = await res.json();
    // Supabase may return an array or object — normalize
    if (Array.isArray(js) && js.length > 0) return { ok: true, user: js[0] };
    if (js && js.id) return { ok: true, user: js };
    return { ok: false, user: null, body: js };
  } catch (err) {
    console.error('findUserByEmail error', err);
    return { ok: false, error: err };
  }
}

async function createUser(email, password) {
  const url = `${SUPABASE_URL}/auth/v1/admin/users`;
  const headers = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`
  };
  const body = { email, password, email_confirm: true };
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  const text = await res.text().catch(()=>null);
  if (!res.ok) return { ok: false, status: res.status, body: text };
  const js = JSON.parse(text || '{}');
  return { ok: true, user: js };
}

async function updateUserPassword(uid, password) {
  const url = `${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(uid)}`;
  const headers = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`
  };
  const body = { password, email_confirm: true };
  const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(body) });
  const text = await res.text().catch(()=>null);
  if (!res.ok) return { ok: false, status: res.status, body: text };
  const js = JSON.parse(text || '{}');
  return { ok: true, user: js };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'method_not_allowed' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return json(res, 501, { error: 'supabase_not_configured' });
  }

  const { email, password, token } = req.body || {};

  if (!email || !password) {
    return json(res, 400, { error: 'missing_email_or_password' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return json(res, 400, { error: 'password_too_short' });
  }

  // 1) Validate token via Stripe (if provided / if configured)
  if (token) {
    const v = await stripeValidateToken(token, email);
    if (!v.ok) {
      return json(res, 400, { error: 'invalid_token', reason: v.reason, detail: v.detail || null });
    }
  }

  try {
    // 2) Find existing user by email
    const found = await findUserByEmail(email);
    if (found.ok && found.user) {
      const uid = found.user.id || found.user.user?.id || found.user.uid || null;
      if (!uid) {
        // fallback: try to read id from the top-level object
        const maybeId = found.user.id || null;
        if (!maybeId) {
          console.warn('user found but no id', found.user);
          return json(res, 500, { error: 'user_no_id' });
        }
      }
      const userId = uid || found.user.id;
      // 3a) Update user's password
      const updated = await updateUserPassword(userId, password);
      if (!updated.ok) {
        console.error('updateUserPassword failed', updated);
        return json(res, 500, { error: 'update_password_failed', details: updated.body || updated });
      }
      return json(res, 200, { ok: true, action: 'updated' });
    } else {
      // 3b) Create new user
      const created = await createUser(email, password);
      if (!created.ok) {
        console.error('createUser failed', created);
        // If Supabase returns 400 about existing user, try to parse and surface
        return json(res, 500, { error: 'create_user_failed', details: created.body || created });
      }
      return json(res, 200, { ok: true, action: 'created' });
    }
  } catch (err) {
    console.error('set-password handler error', err);
    return json(res, 500, { error: 'internal', detail: err?.message || String(err) });
  }
}
