// pages/api/auth/set-password.js
// Server endpoint to finalize a new account's password after Stripe Checkout.
// POST { email, password, token }
// - Verifies the Stripe Checkout session token (if present) and that the session email matches.
// - Uses SUPABASE_SERVICE_ROLE_KEY to create the user if missing or update the user's password if present.
// - If create user fails with "email_exists" the handler will attempt to locate the existing user and update its password.
// - Returns 200 on success, suitable for the existing client flow that calls /api/auth/signin afterwards.
//
// Required env:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - STRIPE_SECRET_KEY (recommended; endpoint will validate token if provided)

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
  const url = `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`;
  const headers = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`
  };
  try {
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) {
      return { ok: false, status: res.status, body: await res.text().catch(()=>null) };
    }
    const js = await res.json();
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
  try {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    const text = await res.text().catch(()=>null);
    if (!res.ok) return { ok: false, status: res.status, body: text };
    const js = JSON.parse(text || '{}');
    return { ok: true, user: js };
  } catch (err) {
    console.error('createUser error', err);
    return { ok: false, error: err };
  }
}

async function updateUserPassword(uid, password) {
  const url = `${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(uid)}`;
  const headers = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`
  };
  const body = { password, email_confirm: true };
  try {
    const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(body) });
    const text = await res.text().catch(()=>null);
    if (!res.ok) return { ok: false, status: res.status, body: text };
    const js = JSON.parse(text || '{}');
    return { ok: true, user: js };
  } catch (err) {
    console.error('updateUserPassword error', err);
    return { ok: false, error: err };
  }
}

function parseCreateError(body) {
  // body may be JSON string or plain text; try to extract error_code/email_exists
  try {
    const parsed = typeof body === 'string' ? JSON.parse(body) : body;
    if (parsed?.error_code) return parsed.error_code;
    if (parsed?.code && parsed?.msg) {
      // some responses embed a code/msg
      if (typeof parsed.msg === 'string' && parsed.msg.includes('already been registered')) return 'email_exists';
    }
  } catch (e) {
    // ignore
  }
  try {
    if (typeof body === 'string' && body.includes('email_exists')) return 'email_exists';
    if (typeof body === 'string' && body.includes('A user with this email address has already been registered')) return 'email_exists';
  } catch (e) {}
  return null;
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

  if (token) {
    const v = await stripeValidateToken(token, email);
    if (!v.ok) {
      return json(res, 400, { error: 'invalid_token', reason: v.reason, detail: v.detail || null });
    }
  }

  try {
    // First attempt to locate user
    const found = await findUserByEmail(email);
    if (found.ok && found.user) {
      const uid = found.user.id || found.user.user?.id || found.user.uid || null;
      if (!uid) {
        console.warn('user found but no id', found.user);
        return json(res, 500, { error: 'user_no_id' });
      }
      const updated = await updateUserPassword(uid, password);
      if (!updated.ok) {
        console.error('updateUserPassword failed', updated);
        return json(res, 500, { error: 'update_password_failed', details: updated.body || updated });
      }
      return json(res, 200, { ok: true, action: 'updated' });
    }

    // Not found -> try create
    const created = await createUser(email, password);
    if (created.ok) {
      return json(res, 200, { ok: true, action: 'created' });
    }

    // If creation failed, try to detect email_exists and then attempt to find + update
    const createErrCode = parseCreateError(created.body || created.error || created);
    if (createErrCode === 'email_exists') {
      // try to find user again and update password
      const found2 = await findUserByEmail(email);
      if (found2.ok && found2.user) {
        const uid2 = found2.user.id || found2.user.user?.id || found2.user.uid || null;
        if (!uid2) {
          console.warn('user found (after create failure) but no id', found2.user);
          return json(res, 500, { error: 'user_no_id_after_create' });
        }
        const updated2 = await updateUserPassword(uid2, password);
        if (!updated2.ok) {
          console.error('updateUserPassword after create failure failed', updated2);
          return json(res, 500, { error: 'update_password_failed_after_create', details: updated2.body || updated2 });
        }
        return json(res, 200, { ok: true, action: 'updated_after_create_conflict' });
      } else {
        console.error('email_exists but user not found after create failure', created);
        return json(res, 500, { error: 'email_exists_but_user_not_found', details: created.body || created });
      }
    }

    // Other create error: surface it
    console.error('createUser failed', created);
    return json(res, 500, { error: 'create_user_failed', details: created.body || created });
  } catch (err) {
    console.error('set-password handler error', err);
    return json(res, 500, { error: 'internal', detail: err?.message || String(err) });
  }
}
