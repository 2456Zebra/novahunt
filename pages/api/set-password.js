import { randomBytes, scryptSync } from 'crypto';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret-change-me';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set - DB operations will fail.');
}

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

/**
 * POST /api/set-password
 * - Accepts { password, session_id?, token? }
 * - Hashes password, upserts user in Supabase "users" table, issues JWT cookie, returns redirect.
 *
 * Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in Vercel (server-only).
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const { password, session_id, token } = req.body || {};

  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password is required and must be at least 8 characters.' });
  }

  let email = null;

  // 1) Token verification placeholder (if you implement one-time tokens)
  if (token) {
    // TODO: verify token and set email from token payload
    // const payload = verifyOneTimeToken(token);
    // if (!payload || !payload.email) return res.status(400).json({ error: 'Invalid token' });
    // email = payload.email;
  }

  // 2) Fallback: resolve email from Stripe Checkout session (server-side)
  if (!email && session_id && stripe) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ['customer', 'customer_details'],
      });
      email = session?.customer_details?.email || (session.customer && session.customer.email) || null;
    } catch (err) {
      console.error('Failed to retrieve stripe session', err);
      return res.status(500).json({ error: 'Unable to verify session_id with Stripe' });
    }
  }

  if (!email) {
    return res.status(400).json({ error: 'Unable to determine account email. Provide a valid token or session_id.' });
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Database client not configured (SUPABASE env variables missing).' });
  }

  try {
    // Hash password using scrypt + salt
    const salt = randomBytes(16).toString('hex');
    const derived = scryptSync(password, salt, 64);
    const passwordHash = `${salt}:${derived.toString('hex')}`;

    // Upsert user in Supabase users table
    // Note: this requires SUPABASE_SERVICE_ROLE_KEY (server-side)
    const upsertPayload = { email, password_hash: passwordHash, updated_at: new Date().toISOString() };
    const { data: upsertData, error: upsertError } = await supabase
      .from('users')
      .upsert(upsertPayload, { onConflict: 'email' })
      .select()
      .single();

    if (upsertError) {
      console.error('Supabase upsert error', upsertError);
      return res.status(500).json({ error: 'Database error while creating/updating user' });
    }

    const userId = upsertData?.id || `supabase:${upsertData?.email || email}`;

    // Issue a JWT for the session
    const tokenPayload = { sub: userId, email };
    const jwtOptions = { expiresIn: '7d' };
    const authToken = jwt.sign(tokenPayload, JWT_SECRET, jwtOptions);

    // Set cookie (HttpOnly). Use Secure=true in production.
    const secure = process.env.NODE_ENV === 'production';
    const cookieParts = [
      `auth=${authToken}`,
      'HttpOnly',
      'Path=/',
      `Max-Age=${7 * 24 * 60 * 60}`,
      'SameSite=Lax',
    ];
    if (secure) cookieParts.push('Secure');

    res.setHeader('Set-Cookie', cookieParts.join('; '));

    return res.status(200).json({ ok: true, redirect: '/dashboard', email });
  } catch (err) {
    console.error('Error in set-password handler', err);
    return res.status(500).json({ error: 'Failed to set password' });
  }
}
