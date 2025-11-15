// Server endpoint to finalize a Stripe Checkout return and create a local session + user record.
// Usage: POST /api/complete-checkout with JSON body { sessionId: "<checkout_session_id>" }
// Also supports GET with query ?sessionId=...
import Stripe from 'stripe';
import { getKV } from './_kv-wrapper';
const kv = getKV();
import crypto from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

function makeSessionString(email) {
  const payload = {
    email,
    created_at: new Date().toISOString(),
  };
  return JSON.stringify(payload);
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

export default async function handler(req, res) {
  try {
    const sessionId = (req.method === 'GET' ? req.query.sessionId : (req.body && req.body.sessionId)) || null;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

    // Retrieve the Checkout Session from Stripe and expand customer if available
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['customer'] });
    } catch (err) {
      console.error('Stripe retrieve session error', err?.message || err);
      return res.status(500).json({ error: 'Could not retrieve checkout session' });
    }

    // Extract email: prefer session.customer_email, then expanded customer, then metadata.nh_session (if it encodes email)
    let email = session.customer_email || null;
    if (!email && session.customer && session.customer.email) email = session.customer.email;

    if (!email && session.metadata && session.metadata.nh_session) {
      try {
        const parsed = JSON.parse(session.metadata.nh_session);
        email = parsed?.email || null;
      } catch (e) {
        // ignore parse errors
      }
    }

    if (!email) {
      // No email to create a local session for
      return res.status(400).json({ error: 'Could not determine customer email from Checkout Session' });
    }

    const emailKey = String(email).toLowerCase();

    // Persist a small mapping in KV so we can correlate later (and help webhook reconciliation)
    try {
      if (kv) {
        await kv.set(`stripe:checkout:${sessionId}`, { email: emailKey, sessionId, created_at: new Date().toISOString() }, { ex: 60 * 60 * 24 * 7 });
      }
    } catch (e) {
      console.warn('KV write (checkout mapping) failed', e?.message || e);
    }

    // Ensure a basic user record exists; if no password present, create a set-password token
    let setPasswordToken = null;
    try {
      if (kv) {
        const existing = await kv.get(`user:${emailKey}`);
        if (!existing) {
          // create a minimal user record
          const userRecord = {
            email: emailKey,
            created_at: new Date().toISOString(),
            has_password: false,
            metadata: {
              created_via: 'stripe_checkout',
              stripe_customer: session.customer || null,
            },
          };
          await kv.set(`user:${emailKey}`, userRecord);
          // create one-time token to let user set a password
          setPasswordToken = generateToken();
          const tokenKey = `user:setpw:${setPasswordToken}`;
          await kv.set(tokenKey, { email: emailKey, created_at: new Date().toISOString() }, { ex: 60 * 60 * 24 }); // expires in 24h
        } else {
          // existing user: if they don't have a password we can create token for convenience
          if (!existing.has_password) {
            setPasswordToken = generateToken();
            const tokenKey = `user:setpw:${setPasswordToken}`;
            await kv.set(tokenKey, { email: emailKey, created_at: new Date().toISOString() }, { ex: 60 * 60 * 24 });
          }
        }
      }
    } catch (e) {
      console.warn('KV write (user record) failed', e?.message || e);
    }

    // Create a simple local session string and store server-side (optional)
    const nhSessionString = makeSessionString(emailKey);

    try {
      if (kv) {
        await kv.set(`local:session:${emailKey}`, { nhSession: nhSessionString, created_at: new Date().toISOString() }, { ex: 60 * 60 * 24 * 30 });
      }
    } catch (e) {
      console.warn('KV write (local session) failed', e?.message || e);
    }

    // Set a cookie for compatibility and return nh_session and token (if any)
    const cookieValue = encodeURIComponent(nhSessionString);
    const cookie = `nh_session=${cookieValue}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
    res.setHeader('Set-Cookie', cookie);

    return res.status(200).json({
      ok: true,
      email: emailKey,
      sessionId,
      nh_session: nhSessionString,
      set_password_token: setPasswordToken,
    });
  } catch (err) {
    console.error('complete-checkout error', err?.message || err);
    return res.status(500).json({ error: 'Server error' });
  }
}
