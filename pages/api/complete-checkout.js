// Server endpoint to finalize a Stripe Checkout return and create a local session.
// Usage: POST /api/complete-checkout with JSON body { sessionId: "<checkout_session_id>" }
// Also supports GET with query ?sessionId=...
import Stripe from 'stripe';
import { getKV } from './_kv-wrapper';
const kv = getKV();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

function makeSessionString(email) {
  const payload = {
    email,
    created_at: new Date().toISOString(),
  };
  // simple encoded string; you can replace with JWT or other token later
  return JSON.stringify(payload);
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

    // Create a simple local session string and store server-side (optional)
    const nhSessionString = makeSessionString(emailKey);

    try {
      if (kv) {
        // store by email and also by raw token if you want to validate later
        await kv.set(`local:session:${emailKey}`, { nhSession: nhSessionString, created_at: new Date().toISOString() }, { ex: 60 * 60 * 24 * 30 });
      }
    } catch (e) {
      console.warn('KV write (local session) failed', e?.message || e);
    }

    // Set a cookie for compatibility (not required if client writes localStorage)
    // Cookie is HttpOnly (so client JS can't read it) but we'll also return the nh_session so client can write localStorage.
    const cookieValue = encodeURIComponent(nhSessionString);
    const cookie = `nh_session=${cookieValue}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
    res.setHeader('Set-Cookie', cookie);

    // Return session details and the nh_session string so the client page can store it in localStorage
    return res.status(200).json({ ok: true, email: emailKey, sessionId, nh_session: nhSessionString });
  } catch (err) {
    console.error('complete-checkout error', err?.message || err);
    return res.status(500).json({ error: 'Server error' });
  }
}
