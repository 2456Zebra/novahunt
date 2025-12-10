import crypto from 'crypto';

// NOTE: This file expects these env vars in Vercel:
// - STRIPE_SECRET_KEY   (optional for verifying signature; recommended)
// - STRIPE_WEBHOOK_SECRET (optional, if you want to verify signatures)
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function json(res, status, body) {
  res.status(status).json(body);
}

async function createOrEnsureUser(email, meta = {}) {
  // create a secure random password for initial creation
  const pwd = crypto.randomBytes(24).toString('hex'); // 48 hex chars

  const url = `${SUPABASE_URL}/auth/v1/admin/users`;
  const headers = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`
  };
  const body = {
    email,
    password: pwd,
    email_confirm: true,
    user_metadata: { ...meta, created_from: 'stripe_webhook' }
  };

  try {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    const txt = await res.text().catch(()=>null);
    if (res.ok) {
      console.info('Supabase: created user for', email);
      return { ok: true, created: true, body: txt };
    }
    // If the user already exists, we treat that as OK — log and return
    if (res.status === 422 && txt && txt.includes('email_exists')) {
      console.info('Supabase: user already exists for', email);
      return { ok: true, created: false, reason: 'email_exists', body: txt };
    }
    console.warn('Supabase create user returned', res.status, txt?.slice?.(0,1000));
    return { ok: false, status: res.status, body: txt };
  } catch (err) {
    console.error('createOrEnsureUser error', err?.message || String(err));
    return { ok: false, error: err };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'method_not_allowed' });
  }

  // Optional: verify Stripe signature if you configure STRIPE_WEBHOOK_SECRET
  let event;
  try {
    const buf = await getRawBody(req);
    if (STRIPE_WEBHOOK_SECRET) {
      const sig = req.headers['stripe-signature'];
      if (!sig) {
        console.warn('Missing stripe-signature header');
        return json(res, 400, { error: 'missing_signature' });
      }
      // If you want to validate, use stripe library here (omitted to keep this file dependency-free).
      // For now: skip verification if not configured.
    }
    // Parse the body (assume JSON)
    event = JSON.parse(buf.toString());
  } catch (err) {
    console.error('Webhook parse error', err?.message || String(err));
    return json(res, 400, { error: 'bad_request' });
  }

  try {
    const type = event.type || event.event || 'unknown';
    if (type === 'checkout.session.completed' || type === 'checkout.session.async_payment_succeeded') {
      const session = event.data?.object || {};
      const email = session.customer_details?.email || session.customer_email || session.metadata?.email;
      if (!email) {
        console.warn('Webhook: checkout.session.completed with no email');
        return json(res, 200, { ok: true, msg: 'no_email' });
      }

      // create or ensure a user with a random password so the account has a password
      const meta = { stripe_event: type };
      const created = await createOrEnsureUser(email, meta);

      if (!created.ok) {
        console.error('Webhook: failed creating user', created);
        return json(res, 500, { error: 'create_user_failed', details: created });
      }

      // Optionally do other post-create steps (assign role, insert into db, etc.)
      return json(res, 200, { ok: true, created: created.created });
    }

    // ignore other events
    console.info('Unhandled Stripe event type:', type);
    return json(res, 200, { ok: true, msg: 'ignored' });
  } catch (err) {
    console.error('Webhook handler error', err?.message || String(err));
    return json(res, 500, { error: 'internal', detail: err?.message || String(err) });
  }
}

// Helper to read raw request body
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
