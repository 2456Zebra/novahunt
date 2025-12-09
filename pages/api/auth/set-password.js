// pages/api/auth/set-password.js
// Robust finalize endpoint with optional emergency disable for password recovery emails.
// - Validates Stripe session token (optional).
// - Attempts to create or update the Supabase user using the service role key.
// - On success, exchanges email+password for a session (anon key) and sets HttpOnly cookies.
// - Retries admin lookup when create returns email_exists; falls back to recover email.
// - Handles Supabase recover rate limits gracefully and supports emergency disable via env.
//
// Required Vercel env vars (Preview & Production):
// - SUPABASE_URL               (e.g. https://xyz.supabase.co)
// - SUPABASE_SERVICE_ROLE_KEY  (service role)
// - SUPABASE_ANON_KEY          (anon/public key)
// - COOKIE_DOMAIN              (e.g. .novahunt.ai) - recommended
// Optional:
// - STRIPE_SECRET_KEY
// - POST_RESET_REDIRECT
// - DISABLE_PASSWORD_RECOVER   (set to "1" to disable sending recover emails immediately)

import Stripe from 'stripe';

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const DEFAULT_COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || '';
const POST_RESET_REDIRECT = process.env.POST_RESET_REDIRECT || 'https://www.novahunt.ai/set-password';
const DISABLE_PASSWORD_RECOVER = process.env.DISABLE_PASSWORD_RECOVER === '1';

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

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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
    console.error('stripe validate error', err?.message || String(err));
    return { ok: false, reason: 'stripe_error', detail: err?.message || String(err) };
  }
}

async function findUserByEmail(email) {
  const url = `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`;
  const headers = { 'Content-Type': 'application/json', apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` };
  try {
    const res = await fetch(url, { method: 'GET', headers });
    const txt = await res.text().catch(()=>null);
    if (!res.ok) {
      console.warn('findUserByEmail HTTP', res.status, txt?.slice?.(0,1000));
      return { ok: false, status: res.status, body: txt };
    }
    let js = null;
    try { js = JSON.parse(txt || 'null'); } catch(e) { js = txt; }
    if (Array.isArray(js) && js.length > 0) return { ok: true, user: js[0] };
    if (js && js.id) return { ok: true, user: js };
    return { ok: false, user: null, body: js };
  } catch (err) {
    console.error('findUserByEmail error', err?.message || String(err));
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
    if (!res.ok) {
      console.warn('createUser failed HTTP', res.status, txt?.slice?.(0,1000));
      return { ok: false, status: res.status, body: txt };
    }
    const js = JSON.parse(txt || '{}');
    return { ok: true, user: js };
  } catch (err) {
    console.error('createUser error', err?.message || String(err));
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
    if (!res.ok) {
      console.warn('updateUserPassword failed HTTP', res.status, txt?.slice?.(0,1000));
      return { ok: false, status: res.status, body: txt };
    }
    const js = JSON.parse(txt || '{}');
    return { ok: true, user: js };
  } catch (err) {
    console.error('updateUserPassword error', err?.message || String(err));
    return { ok: false, error: err };
  }
}

function parseCreateError(body) {
  try {
    const parsed = typeof body === 'string' ? JSON.parse(body) : body;
    if (parsed?.error_code) return parsed.error_code;
    if (parsed?.code && parsed?.msg && typeof parsed.msg === 'string' && parsed.msg.includes('already been registered')) return 'email_exists';
  } catch(e){}
  try {
    if (typeof body === 'string' && body.includes('email_exists')) return 'email_exists';
    if (typeof body === 'string' && body.includes('A user with this email address has already been registered')) return 'email_exists';
  } catch(e){}
  return null;
}

/**
 * sendPasswordRecover
 * - Returns { ok:true } on success
 * - Returns { ok:false, status, body, retryAfter } on failure
 */
async function sendPasswordRecover(email) {
  if (DISABLE_PASSWORD_RECOVER) {
    // Immediate friendly response — avoids sending further emails while disabled
    return { ok: false, status: 429, body: 'recover_disabled', retryAfter: 999999 };
  }

  const url = `${SUPABASE_URL}/auth/v1/recover`;
  const headers = { 'Content-Type': 'application/json', apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` };
  const body = { email, redirect_to: POST_RESET_REDIRECT };
  try {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    const txt = await res.text().catch(()=>null);
    if (res.ok) {
      return { ok: true, body: txt };
    }
    const retryAfterHeader = res.headers.get ? res.headers.get('Retry-After') : null;
    const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 40;
    return { ok: false, status: res.status, body: txt, retryAfter: retryAfter || 40 };
  } catch (err) {
    console.error('sendPasswordRecover error', err?.message || String(err));
    return { ok: false, error: err };
  }
}

async function signInAndSetCookies({ email, password, req, res }) {
  if (!SUPABASE_ANON_KEY) return { ok: false, reason: 'no_anon_key' };

  const tokenUrl = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
  const headers = { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };
  try {
    const tokenRes = await fetch(tokenUrl, { method: 'POST', headers, body: JSON.stringify({ email, password }) });
    const txt = await tokenRes.text().catch(()=>null);
    if (!tokenRes.ok) {
      console.warn('token exchange failed', tokenRes.status, txt?.slice?.(0,1000));
      return { ok: false, status: tokenRes.status, body: txt };
    }
    const js = JSON.parse(txt || '{}');
    const accessToken = js.access_token || null;
    const refreshToken = js.refresh_token || null;
    const expiresIn = js.expires_in || 60 * 60 * 24 * 7;
    if (!accessToken) return { ok: false, reason: 'no_access_token', body: js };

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

    res.setHeader('Set-Cookie', cookies);
    return { ok: true, session: { expires_in: maxAge } };
  } catch (err) {
    console.error('signInAndSetCookies error', err?.message || String(err));
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

  // Validate Stripe token if present
  if (token) {
    const v = await stripeValidateToken(token, email);
    if (!v.ok) return json(res, 400, { error: 'invalid_token', reason: v.reason, detail: v.detail || null });
  }

  try {
    // 1) Try to locate user
    let found = await findUserByEmail(email);
    if (found.ok && found.user) {
      const uid = found.user.id || found.user.user?.id || found.user.uid || null;
      if (uid) {
        const updated = await updateUserPassword(uid, password);
        if (!updated.ok) {
          // Fallback to recover; handle rate-limit or disabled recover gracefully
          const recover = await sendPasswordRecover(email);
          if (recover.ok) return json(res, 200, { ok: true, action: 'password_reset_sent', message: 'Password recovery email sent' });
          if (recover.status === 429) {
            return json(res, 200, { ok: true, action: 'password_reset_rate_limited', retry_after: recover.retryAfter || 40, message: 'Password recovery has been requested recently. Please check your email or try again in a bit.' });
          }
          if (recover.body === 'recover_disabled') {
            return json(res, 200, { ok: true, action: 'password_reset_disabled', message: 'Password recovery temporarily disabled. Contact support.' });
          }
          return json(res, 500, { error: 'update_password_failed', details: updated.body || updated });
        }
        // After update, create session & set cookies
        const signed = await signInAndSetCookies({ email, password, req, res });
        if (!signed.ok) {
          return json(res, 200, { ok: true, action: 'updated', warning: 'session_not_created', details: signed.body || signed });
        }
        return json(res, 200, { ok: true, action: 'updated', session: signed.session || null });
      }
    }

    // 2) Not found -> try create
    const created = await createUser(email, password);
    if (created.ok) {
      const signed = await signInAndSetCookies({ email, password, req, res });
      if (!signed.ok) {
        return json(res, 200, { ok: true, action: 'created', warning: 'session_not_created', details: signed.body || signed });
      }
      return json(res, 200, { ok: true, action: 'created', session: signed.session || null });
    }

    // 3) Creation failed: check for email_exists
    const createErrCode = parseCreateError(created.body || created.error || created);
    if (createErrCode === 'email_exists') {
      // retry admin lookup/update with backoff
      const attempts = 5;
      for (let i = 0; i < attempts; i++) {
        await sleep(500 * (i+1));
        const f = await findUserByEmail(email);
        if (f.ok && f.user) {
          const uid2 = f.user.id || f.user.user?.id || f.user.uid || null;
          if (uid2) {
            const updated2 = await updateUserPassword(uid2, password);
            if (updated2.ok) {
              const signed2 = await signInAndSetCookies({ email, password, req, res });
              if (!signed2.ok) {
                return json(res, 200, { ok: true, action: 'updated_after_create_conflict', warning: 'session_not_created', details: signed2.body || signed2 });
              }
              return json(res, 200, { ok: true, action: 'updated_after_create_conflict', session: signed2.session || null });
            }
          }
        }
      }

      // After retries still not found or updated -> send recover (but respect disable and rate limits)
      const recover = await sendPasswordRecover(email);
      if (recover.ok) return json(res, 200, { ok: true, action: 'password_reset_sent', message: 'Password recovery email sent' });
      if (recover.status === 429) {
        return json(res, 200, { ok: true, action: 'password_reset_rate_limited', retry_after: recover.retryAfter || 40, message: 'Password recovery has been requested recently. Please check your email or try again in a bit.' });
      }
      if (recover.body === 'recover_disabled') {
        return json(res, 200, { ok: true, action: 'password_reset_disabled', message: 'Password recovery temporarily disabled. Contact support.' });
      }
      return json(res, 500, { error: 'password_recover_failed', details: recover.body || recover });
    }

    // Other create errors
    return json(res, 500, { error: 'create_user_failed', details: created.body || created });
  } catch (err) {
    console.error('set-password handler critical error', err?.message || String(err));
    return json(res, 500, { error: 'internal', detail: err?.message || String(err) });
  }
}
