// pages/api/auth/set-password.js
// Robust finalize endpoint for new accounts (unified create/update + immediate session cookie).
// - Validates Stripe session token (optional, requires STRIPE_SECRET_KEY).
// - Uses SUPABASE_SERVICE_ROLE_KEY to create or PATCH a user so the password is set.
// - After creating/updating, exchanges email+password for a Supabase session token
//   (POST /auth/v1/token?grant_type=password using SUPABASE_ANON_KEY) and sets HttpOnly cookies
//   (session, sb:token, refresh_token) so the user is immediately signed in.
// - Falls back to sending recover email if Supabase reports email_exists but the admin lookup
//   cannot locate the user.
//
// Required env vars (must be set in Vercel for Preview & Production):
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - SUPABASE_ANON_KEY
// - COOKIE_DOMAIN (recommended: ".novahunt.ai")
// Optional:
// - STRIPE_SECRET_KEY (recommended to validate token)
// - POST_RESET_REDIRECT (optional redirect for recovery email)

import Stripe from 'stripe';

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const DEFAULT_COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || '';
const POST_RESET_REDIRECT = process.env.POST_RESET_REDIRECT || 'https://www.novahunt.ai/set-password';

function json(res, status, body) {
  res.status(status).json(body);
}

function deriveCookieDomainFromHost(hostHeader) {
  if (!hostHeader) return '';
  const host = hostHeader.split(':')[0];
  const parts = host.split('.');
  if (parts.length <= 2) return '.' + host;
  return '.' + parts.slice(-2).join('.');
}

async function stripeValidateToken(token, email) {
  if (!STRIPE_SECRET_KEY) return { ok: true, reason: 'no_stripe_key' };
  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });
  try {
    const session = await stripe.checkout.sessions.retrieve(token, { expand: ['customer'] });
    const sessionEmail = session.customer_details?.email || session.customer?.email || session.customer_email || null;
    const paid = session.payment_status === 'paid' || session.status === 'complete' || !!session.amount_total;
    if (!sessionEmail) return { ok: false, reason: 'stripe_no_email' };
    if ((sessionEmail || '').toLowerCase() !== String(email || '').toLowerCase()) return { ok: false, reason: 'email_mismatch' };
    if (!paid) return { ok: false, reason: 'payment_not_completed' };
    return { ok: true, session };
  } catch (err) {
    console.error('stripe validate error', err);
    return { ok: false, reason: 'stripe_error', detail: err?.message || String(err) };
  }
}

async function findUserByEmail(email) {
  const url = `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`;
  const headers = { 'Content-Type': 'application/json', apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` };
  try {
    const res = await fetch(url, { method: 'GET', headers });
    const txt = await res.text().catch(()=>null);
    if (!res.ok) return { ok: false, status: res.status, body: txt };
    const js = JSON.parse(txt || 'null');
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
  const headers = { 'Content-Type': 'application/json', apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` };
  const body = { email, password, email_confirm: true };
  try {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    const txt = await res.text().catch(()=>null);
    if (!res.ok) return { ok: false, status: res.status, body: txt };
    const js = JSON.parse(txt || '{}');
    return { ok: true, user: js };
  } catch (err) {
    console.error('createUser error', err);
    return { ok: false, error: err };
  }
}

async function updateUserPassword(uid, password) {
  const url = `${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(uid)}`;
  const headers = { 'Content-Type': 'application/json', apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` };
  const body = { password, email_confirm: true };
  try {
    const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(body) });
    const txt = await res.text().catch(()=>null);
    if (!res.ok) return { ok: false, status: res.status, body: txt };
    const js = JSON.parse(txt || '{}');
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
    if (parsed?.code && parsed?.msg && typeof parsed.msg === 'string' && parsed.msg.includes('already been registered')) return 'email_exists';
  } catch(e) {}
  try {
    if (typeof body === 'string' && body.includes('email_exists')) return 'email_exists';
    if (typeof body === 'string' && body.includes('A user with this email address has already been registered')) return 'email_exists';
  } catch(e){}
  return null;
}

async function sendPasswordRecover(email) {
  const url = `${SUPABASE_URL}/auth/v1/recover`;
  const headers = { 'Content-Type': 'application/json', apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` };
  const body = { email, redirect_to: POST_RESET_REDIRECT };
  try {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    const txt = await res.text().catch(()=>null);
    if (!res.ok) return { ok: false, status: res.status, body: txt };
    return { ok: true, body: txt };
  } catch (err) {
    console.error('sendPasswordRecover error', err);
    return { ok: false, error: err };
  }
}

async function signInAndSetCookies({ email, password, req, res }) {
  // Exchange email+password for a session (server-side). Uses SUPABASE_ANON_KEY.
  if (!SUPABASE_ANON_KEY) return { ok: false, reason: 'no_anon_key' };

  const tokenUrl = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
  const headers = { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };
  try {
    const tokenRes = await fetch(tokenUrl, { method: 'POST', headers, body: JSON.stringify({ email, password }) });
    const txt = await tokenRes.text().catch(()=>null);
    if (!tokenRes.ok) {
      console.warn('token exchange failed', tokenRes.status, txt);
      return { ok: false, status: tokenRes.status, body: txt };
    }
    const js = JSON.parse(txt || '{}');
    const accessToken = js.access_token || js.access_token || null;
    const refreshToken = js.refresh_token || null;
    const expiresIn = js.expires_in || 60 * 60 * 24 * 7;

    if (!accessToken) return { ok: false, reason: 'no_access_token', body: js };

    // Determine cookie domain
    let cookieDomain = DEFAULT_COOKIE_DOMAIN && DEFAULT_COOKIE_DOMAIN.trim().length ? DEFAULT_COOKIE_DOMAIN.trim() : '';
    if (!cookieDomain) cookieDomain = deriveCookieDomainFromHost(req.headers.host) || '';

    const maxAge = Number(expiresIn) || 60 * 60 * 24 * 7;
    const baseCookieOpts = [
      'Path=/',
      cookieDomain ? `Domain=${cookieDomain}` : '',
      'HttpOnly',
      'SameSite=None',
      'Secure',
      `Max-Age=${maxAge}`
    ].filter(Boolean).join('; ');

    const cookies = [
      `session=${accessToken}; ${baseCookieOpts}`,
      `sb:token=${accessToken}; ${baseCookieOpts}`
    ];

    if (refreshToken) {
      const refreshOpts = [
        'Path=/',
        cookieDomain ? `Domain=${cookieDomain}` : '',
        'HttpOnly',
        'SameSite=None',
        'Secure',
        `Max-Age=${60 * 60 * 24 * 30}`
      ].filter(Boolean).join('; ');
      cookies.push(`refresh_token=${refreshToken}; ${refreshOpts}`);
    }

    // Set all Set-Cookie headers
    res.setHeader('Set-Cookie', cookies);
    return { ok: true, session: { expires_in: maxAge } };
  } catch (err) {
    console.error('signInAndSetCookies error', err);
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
  if (!email || !password) return json(res, 400, { error: 'missing_email_or_password' });
  if (typeof password !== 'string' || password.length < 8) return json(res, 400, { error: 'password_too_short' });

  // 1) Optional Stripe token validation
  if (token) {
    const v = await stripeValidateToken(token, email);
    if (!v.ok) return json(res, 400, { error: 'invalid_token', reason: v.reason, detail: v.detail || null });
  }

  try {
    // 2) Try to locate user first
    const found = await findUserByEmail(email);
    if (found.ok && found.user) {
      const uid = found.user.id || found.user.user?.id || found.user.uid || null;
      if (uid) {
        const updated = await updateUserPassword(uid, password);
        if (!updated.ok) {
          console.error('updateUserPassword failed', updated);
          // If update fails, attempt recover email fallback
          const recover = await sendPasswordRecover(email);
          if (recover.ok) return json(res, 200, { ok: true, action: 'password_reset_sent', message: 'Password recovery email sent' });
          return json(res, 500, { error: 'update_password_failed', details: updated.body || updated });
        }
        // 2a) After update, create session and set cookies
        const signed = await signInAndSetCookies({ email, password, req, res });
        if (!signed.ok) {
          // session creation failed — still return success of update, but advise retry signin
          return json(res, 200, { ok: true, action: 'updated', warning: 'session_not_created', details: signed.body || signed });
        }
        return json(res, 200, { ok: true, action: 'updated', session: signed.session || null });
      }
    }

    // 3) Not found -> attempt create
    const created = await createUser(email, password);
    if (created.ok) {
      // created successfully -> create session and set cookies
      const signed = await signInAndSetCookies({ email, password, req, res });
      if (!signed.ok) {
        return json(res, 200, { ok: true, action: 'created', warning: 'session_not_created', details: signed.body || signed });
      }
      return json(res, 200, { ok: true, action: 'created', session: signed.session || null });
    }

    // 4) Creation failed -> check for email_exists and handle
    const createErrCode = parseCreateError(created.body || created.error || created);
    if (createErrCode === 'email_exists') {
      // try to locate user again and update; if not found, fallback to password recover
      const found2 = await findUserByEmail(email);
      if (found2.ok && found2.user) {
        const uid2 = found2.user.id || found2.user.user?.id || found2.user.uid || null;
        if (uid2) {
          const updated2 = await updateUserPassword(uid2, password);
          if (updated2.ok) {
            const signed2 = await signInAndSetCookies({ email, password, req, res });
            if (!signed2.ok) {
              return json(res, 200, { ok: true, action: 'updated_after_create_conflict', warning: 'session_not_created', details: signed2.body || signed2 });
            }
            return json(res, 200, { ok: true, action: 'updated_after_create_conflict', session: signed2.session || null });
          } else {
            // update failed, fallback to recover
          }
        }
      }

      // fallback: send recover email
      const recover = await sendPasswordRecover(email);
      if (recover.ok) return json(res, 200, { ok: true, action: 'password_reset_sent', message: 'Password recovery email sent' });
      return json(res, 500, { error: 'password_recover_failed', details: recover.body || recover });
    }

    // other create error: surface it
    console.error('createUser failed', created);
    return json(res, 500, { error: 'create_user_failed', details: created.body || created });
  } catch (err) {
    console.error('set-password handler critical error', err);
    return json(res, 500, { error: 'internal', detail: err?.message || String(err) });
  }
}
