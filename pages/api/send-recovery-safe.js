// pages/api/send-recovery-safe.js
// Safe gated "send recovery / set-password email" endpoint.
// POST { email, captchaToken? }
// Guards:
//  - Optional reCAPTCHA verification if RECAPTCHA_SECRET is set
//  - Rejects obvious disposable email domains
//  - Only allows sending if Stripe shows a paid customer for that email OR if a Supabase user already exists
//  - Calls Supabase /auth/v1/recover using the anon key (so Supabase will send the recovery email)
//
// Required env vars (set in Vercel):
//  - NEXT_PUBLIC_SUPABASE_URL
//  - NEXT_PUBLIC_SUPABASE_ANON_KEY
//  - SUPABASE_SERVICE_ROLE_KEY (used only for Supabase user existence check; not strictly required if you rely on Stripe)
// Optional but recommended:
//  - STRIPE_SECRET_KEY (if you want to allow send based on Stripe paid status)
//  - RECAPTCHA_SECRET (if you want to require/validate captchaToken)
import Stripe from 'stripe';
import disposableDomains from '../../lib/disposableEmails';

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET; // optional

async function verifyRecaptcha(token) {
  if (!RECAPTCHA_SECRET) return { ok: true, reason: 'recaptcha_not_configured' };
  if (!token) return { ok: false, reason: 'missing_captcha' };

  try {
    const params = new URLSearchParams();
    params.append('secret', RECAPTCHA_SECRET);
    params.append('response', token);

    const r = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const j = await r.json();
    // For v2, j.success === true; for v3, you may want to check score >= 0.5.
    if (j.success) return { ok: true };
    return { ok: false, reason: 'recaptcha_failed', detail: j };
  } catch (e) {
    console.error('recaptcha verify error', e);
    return { ok: false, reason: 'recaptcha_error', detail: e.message || String(e) };
  }
}

function isDisposableEmail(email) {
  if (!email || typeof email !== 'string') return true;
  const parts = email.split('@');
  if (parts.length !== 2) return true;
  const domain = parts[1].toLowerCase();
  return disposableDomains.has(domain);
}

async function stripeHasPaid(email) {
  if (!STRIPE_SECRET) return false;
  try {
    const stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2022-11-15' });
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (!customers?.data || customers.data.length === 0) return false;
    const customer = customers.data[0];

    // Active subscription?
    const subs = await stripe.subscriptions.list({ customer: customer.id, status: 'active', limit: 1 });
    if (subs?.data && subs.data.length > 0) return true;

    // Paid invoice fallback
    const invoices = await stripe.invoices.list({ customer: customer.id, limit: 5 });
    if (invoices?.data && invoices.data.some(inv => inv.status === 'paid' || inv.paid === true)) return true;

    return false;
  } catch (e) {
    console.error('stripeHasPaid error', e);
    return false;
  }
}

async function supabaseUserExists(email) {
  if (!SUPABASE_SERVICE || !SUPABASE_URL) return false;
  try {
    // Attempt to use the Admin users list endpoint to find user by email.
    // Note: some Supabase setups may not allow listing via this endpoint; handle non-OK as "not found".
    const url = `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`;
    const r = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_SERVICE}`,
        apikey: SUPABASE_SERVICE,
      },
    });

    if (!r.ok) {
      // If endpoint isn't available or permission denied, treat as no-info (caller must rely on Stripe)
      const text = await r.text();
      console.warn('supabaseUserExists: non-ok response', r.status, text);
      return false;
    }

    const j = await r.json();
    // Some Supabase responses return an array of users; check length or object presence
    if (Array.isArray(j)) return j.length > 0;
    // If single object, consider it found
    return !!j?.id || !!j?.aud;
  } catch (e) {
    console.error('supabaseUserExists error', e);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, captchaToken } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Missing email' });

  // Basic formatting check
  const emailLower = (String(email || '')).trim().toLowerCase();
  if (!emailLower.includes('@')) return res.status(400).json({ error: 'Invalid email format' });

  // 1) Reject disposable domains
  if (isDisposableEmail(emailLower)) {
    return res.status(400).json({ error: 'Disposable or blocked email domain' });
  }

  // 2) Verify reCAPTCHA if configured
  const rec = await verifyRecaptcha(captchaToken);
  if (!rec.ok) {
    return res.status(403).json({ error: 'Captcha failed', detail: rec.reason || rec.detail });
  }

  // 3) Verify email belongs to a paid Stripe customer OR an existing Supabase user
  let allowed = false;
  // Prefer Stripe check if available, since many cases are Stripe signups
  if (STRIPE_SECRET) {
    try {
      const paid = await stripeHasPaid(emailLower);
      if (paid) allowed = true;
    } catch (e) {
      console.error('Stripe check error (non-fatal)', e);
    }
  }

  if (!allowed) {
    // Try Supabase user existence
    try {
      const exists = await supabaseUserExists(emailLower);
      if (exists) allowed = true;
    } catch (e) {
      console.error('Supabase existence check error (non-fatal)', e);
    }
  }

  if (!allowed) {
    return res.status(403).json({ error: 'Email not eligible for recovery', detail: 'No paid Stripe customer and no existing user found' });
  }

  // 4) Call Supabase recover endpoint (anon key), which sends the set-password email
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    console.error('Missing supabase env vars for recover');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${SUPABASE_ANON}`,
      },
      body: JSON.stringify({ email: emailLower }),
    });

    const text = await r.text();
    if (!r.ok) {
      console.error('Supabase recover returned non-OK', r.status, text);
      return res.status(r.status).json({ error: 'Failed to send recovery email', detail: text });
    }

    return res.status(200).json({ ok: true, message: 'Recovery email sent' });
  } catch (e) {
    console.error('send-recovery-safe error', e);
    return res.status(500).json({ error: 'Internal error', detail: e.message || String(e) });
  }
}
