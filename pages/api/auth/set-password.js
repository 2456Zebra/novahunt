// pages/api/auth/set-password.js
// Robust finalize endpoint with retries + verbose logs.
// - Validates Stripe session token (optional).
// - Attempts to create or update the Supabase user using the service role key.
// - On create failure with "email_exists", retries admin lookup/update several times (to handle eventual consistency).
// - After successful create/update, exchanges email+password for a session (anon key) and sets HttpOnly cookies.
// - Falls back to sending a password-recovery email if update/create repeatedly fails.
//
// Required Vercel env vars (Preview & Production):
// - SUPABASE_URL               (e.g. https://xyz.supabase.co)
// - SUPABASE_SERVICE_ROLE_KEY  (service role)
// - SUPABASE_ANON_KEY         (anon/public key)
// - COOKIE_DOMAIN             (e.g. .novahunt.ai)
// Optional:
// - STRIPE_SECRET_KEY
// - POST_RESET_REDIRECT
//
// Notes:
// - This file logs helpful non-secret responses to Vercel function logs to help debug mismatches.
// - Do NOT print secrets into logs. This code avoids logging keys/values themselves, only server responses.

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
      // Log status + first 1000 chars for debugging (no secrets)
      console.warn('findUserByEmail HTTP', res.status, txt?.slice?.(0,1000));
      return { ok: false, status: res.status, body: txt };
    }
    let js = null;
    try { js = JSON.parse(txt || 'null'); } catch(e) { js = txt; }
    console.info('findUserByEmail result (truncated)', Array.isArray(js) ? `array(${js.length})` : (js && js.id ? 'object_with_id' : 'no_user'));
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
    console.info('createUser succeeded', js.id ? 'created user id' : 'created user maybe');
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
    console.info('updateUserPassword succeeded', js.id ? 'updated user id' : 'updated user maybe');
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

async function sendPasswordRecover(email) {
  const url = `${SUPABASE_URL}/auth/v1/recover`;
  const headers = { 'Content-Type': 'application/json', apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` };
  const body = { email, redirect_to: POST_RESET_REDIRECT };
  try {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    const txt = await res.text().catch(()=>null);
    if (!res.ok) {
      console.warn('sendPasswordRecover failed HTTP', res.status, txt?.slice?.(0,1000));
      return { ok: false, status: res.status, body: txt };
    }
    console.info('sendPasswordRecover succeeded (recover email triggered)');
    return { ok: true, body: txt };
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
    console.info('signInAndSetCookies: cookies set (Domain truncated for logs).');
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

  if (token) {
    const v = await stripeValidateToken(token, email);
    if (!v.ok) return json(res, 400, { error: 'invalid_token', reason: v.reason, detail: v.detail || null });
  }

  try {
    // Try locate user
    let found = await findUserByEmail(email);
    if (found.ok && found.user) {
      const uid = found.user.id || found.user.user?.id || found.user.uid || null;
      if (uid) {
        const updated = await updateUserPassword(uid, password);
        if (!updated.ok) {
          console.warn('updateUserPassword returned not ok, attempting recover fallback.');
          const recover = await sendPasswordRecover(email);
          if (recover.ok) return json(res, 200, { ok: true, action: 'password_reset_sent', message: 'Password recovery email sent' });
          return json(res, 500, { error: 'update_password_failed', details: updated.body || updated });
        }
        // attempt to create session and set cookies
        const signed = await signInAndSetCookies({ email, password, req, res });
        if (!signed.ok) {
          return json(res, 200, { ok: true, action: 'updated', warning: 'session_not_created', details: signed.body || signed });
        }
        return json(res, 200, { ok: true, action: 'updated', session: signed.session || null });
      }
    }

    // Not found -> try create
    const created = await createUser(email, password);
    if (created.ok) {
      const signed = await signInAndSetCookies({ email, password, req, res });
      if (!signed.ok) {
        return json(res, 200, { ok: true, action: 'created', warning: 'session_not_created', details: signed.body || signed });
      }
      return json(res, 200, { ok: true, action: 'created', session: signed.session || null });
    }

    // Creation failed: maybe email_exists — retry find/update with retries
    const createErrCode = parseCreateError(created.body || created.error || created);
    if (createErrCode === 'email_exists') {
      console.warn('createUser reported email_exists, will retry admin lookup/update (retries=5)');
      const attempts = 5;
      for (let i = 0; i < attempts; i++) {
        await sleep(500 * (i+1)); // progressive backoff
        const f = await findUserByEmail(email);
        console.info(`retry ${i+1} findUserByEmail -> ok=${!!f.ok} user=${!!f.user}`);
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
            } else {
              console.warn('updateUserPassword after find (retry) failed', updated2);
              // continue retries
            }
          }
        }
      }

      // After retries still not found or updated -> send recover
      console.warn('Retries exhausted - sending password recovery as fallback');
      const recover = await sendPasswordRecover(email);
      if (recover.ok) return json(res, 200, { ok: true, action: 'password_reset_sent', message: 'Password recovery email sent' });
      return json(res, 500, { error: 'password_recover_failed', details: recover.body || recover });
    }

    // Other create errors
    console.error('createUser failed with unexpected error', created);
    return json(res, 500, { error: 'create_user_failed', details: created.body || created });
  } catch (err) {
    console.error('set-password handler critical error', err?.message || String(err));
    return json(res, 500, { error: 'internal', detail: err?.message || String(err) });
  }
}
