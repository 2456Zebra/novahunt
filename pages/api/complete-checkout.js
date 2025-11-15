// Server endpoint to finalize a Stripe Checkout return and create a local session + user record.
// This version saves the subscription/customer details to KV if available so check-subscription returns accurate results.
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

    let session;
    try {
      // Expand customer and subscription so we can capture subscription data immediately if available
      session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['customer', 'subscription'] });
    } catch (err) {
      console.error('Stripe retrieve session error', err?.message || err);
      return res.status(500).json({ error: 'Could not retrieve checkout session' });
    }

    // Extract email and subscription
    let email = session.customer_email || null;
    if (!email && session.customer && session.customer.email) email = session.customer.email;

    if (!email && session.metadata && session.metadata.nh_session) {
      try {
        const parsed = JSON.parse(session.metadata.nh_session);
        email = parsed?.email || null;
      } catch (e) {}
    }

    if (!email) return res.status(400).json({ error: 'Could not determine customer email from Checkout Session' });

    const emailKey = String(email).toLowerCase();

    try {
      if (kv) {
        await kv.set(`stripe:checkout:${sessionId}`, { email: emailKey, sessionId, created_at: new Date().toISOString() }, { ex: 60 * 60 * 24 * 7 });
      }
    } catch (e) {
      console.warn('KV write (checkout mapping) failed', e?.message || e);
    }

    // If subscription object was expanded or available, persist it right away so check-subscription detects the plan
    try {
      const subscription = session.subscription || null;
      if (subscription && kv) {
        // store useful info and the raw subscription for later reference
        const priceId = (subscription.items && subscription.items.data && subscription.items.data[0]?.price?.id) || null;
        const toStore = {
          id: subscription.id,
          status: subscription.status || 'unknown',
          priceId,
          current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
          raw: subscription,
          updated_at: new Date().toISOString(),
        };
        await kv.set(`stripe:subscription:${emailKey}`, toStore, { ex: 60 * 60 * 24 * 365 });
      } else if (session.customer && kv) {
        // At least store the customer id so portal creation can find it
        const custId = typeof session.customer === 'string' ? session.customer : (session.customer?.id || null);
        if (custId) {
          const existing = (await kv.get(`stripe:subscription:${emailKey}`)) || {};
          existing.raw = existing.raw || {};
          existing.raw.customer = custId;
          existing.updated_at = new Date().toISOString();
          await kv.set(`stripe:subscription:${emailKey}`, existing, { ex: 60 * 60 * 24 * 365 });
        }
      }
    } catch (e) {
      console.warn('KV write (subscription) failed', e?.message || e);
    }

    // Ensure a basic user record exists; if no password present, create a set-password token
    let setPasswordToken = null;
    try {
      if (kv) {
        const existing = await kv.get(`user:${emailKey}`);
        if (!existing) {
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
          setPasswordToken = generateToken();
          await kv.set(`user:setpw:${setPasswordToken}`, { email: emailKey, created_at: new Date().toISOString() }, { ex: 60 * 60 * 24 });
        } else if (!existing.has_password) {
          setPasswordToken = generateToken();
          await kv.set(`user:setpw:${setPasswordToken}`, { email: emailKey, created_at: new Date().toISOString() }, { ex: 60 * 60 * 24 });
        }
      }
    } catch (e) {
      console.warn('KV write (user record) failed', e?.message || e);
    }

    const nhSessionString = makeSessionString(emailKey);

    try {
      if (kv) {
        await kv.set(`local:session:${emailKey}`, { nhSession: nhSessionString, created_at: new Date().toISOString() }, { ex: 60 * 60 * 24 * 30 });
      }
    } catch (e) {
      console.warn('KV write (local session) failed', e?.message || e);
    }

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
