// pages/api/auth/set-password.js
// Improved finalize endpoint: tries to create or update a Supabase user using the service-role key.
// If create fails with an "email exists" error and the user cannot be located, it falls back to sending
// a password reset email (so the user can set their own password).
//
// Required env:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// Optional:
// - STRIPE_SECRET_KEY (for token validation)
// - POST_RESET_REDIRECT (URL to redirect user to after they click the recovery link; defaults to the set-password page)

import Stripe from 'stripe';

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const POST_RESET_REDIRECT = process.env.POST_RESET_REDIRECT || 'https://www.novahunt.ai/set-password';

function json(res, status, body) {
  res.status(status).json(body);
}

async function stripeValidateToken(token, email) {
  if (!STRIPE_SECRET_KEY) return { ok: true, reason: 'no_stripe_key' };
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
    const text = await res.text().catch(()=>null);
    if (!res.ok) {
      return { ok: false, status: res.status, body: text };
    }
    const js = JSON.parse(text || 'null');
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
  try {
    const parsed = typeof body === 'string' ? JSON.parse(body) : body;
    if (parsed?.error_code) return parsed.error_code;
    if (parsed?.code && parsed?.msg) {
      if (typeof parsed.msg === 'string' && parsed.msg.includes('already been registered')) return 'email_exists';
    }
  } catch (e) {}
  try {
    if (typeof body === 'string' && body.includes('email_exists')) return 'email_exists';
    if (typeof body === 'string' && body.includes('A user with this email address has already been registered')) return 'email_exists';
  } catch (e) {}
  return null;
}

async function sendPasswordRecover(email) {
  // Use the Supabase recover endpoint to send a password reset email.
  const url = `${SUPABASE_URL}/auth/v1/recover`;
  const headers = { 'Content-Type': 'application/json', apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` };
  const body = { email, redirect_to: POST_RESET_REDIRECT };
  try {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    const text = await res.text().catch(()=>null);
    if (!res.ok) return { ok: false, status: res.status, body: text };
    return { ok: true, body: text };
  } catch (err) {
    console.error('sendPasswordRecover error', err);
    return { ok: false, error: err };
  }
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
    // 1) Try to find existing user
    const found = await findUserByEmail(email);
    if (found.ok && found.user) {
      const uid = found.user.id || found.user.user?.id || found.user.uid || null;
      if (!uid) {
        console.warn('user found but no id', found.user);
        // Fall through to try creation and fallback
      } else {
        const updated = await updateUserPassword(uid, password);
        if (!updated.ok) {
          console.error('updateUserPassword failed', updated);
          return json(res, 500, { error: 'update_password_failed', details: updated.body || updated });
        }
        return json(res, 200, { ok: true, action: 'updated' });
      }
    }

    // 2) Not found (or missing id) -> attempt create
    const created = await createUser(email, password);
    if (created.ok) {
      return json(res, 200, { ok: true, action: 'created' });
    }

    // 3) Creation failed -> check for email_exists
    const createErrCode = parseCreateError(created.body || created.error || created);
    if (createErrCode === 'email_exists') {
      // Try to find the user again. If found, update password.
      const found2 = await findUserByEmail(email);
      if (found2.ok && found2.user) {
        const uid2 = found2.user.id || found2.user.user?.id || found2.user.uid || null;
        if (!uid2) {
          console.warn('user found after create failure, but no id', found2.user);
          // Fallback to sending password recovery email
        } else {
          const updated2 = await updateUserPassword(uid2, password);
          if (!updated2.ok) {
            console.error('updateUserPassword after create failure failed', updated2);
            // Fallback to sending password recovery email
          } else {
            return json(res, 200, { ok: true, action: 'updated_after_create_conflict' });
          }
        }
      }

      // If we reach here, we couldn't locate the user to update despite Supabase saying the email exists.
      // As a safe fallback, send a password recovery email so user can set their password themselves.
      const recover = await sendPasswordRecover(email);
      if (recover.ok) {
        return json(res, 200, { ok: true, action: 'password_reset_sent', message: 'Password recovery email sent' });
      } else {
        console.error('password recover failed', recover);
        return json(res, 500, { error: 'password_recover_failed', details: recover.body || recover });
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
