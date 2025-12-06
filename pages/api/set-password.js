/**
 * POST /api/set-password
 *
 * Expected JSON body:
 * {
 *   "password": "newPassword",
 *   "session_id": "cs_test_....",   // optional if you use session-based flow
 *   "token": "oneTimeToken"         // optional if you use your own one-time token flow
 * }
 *
 * Behavior:
 * - Only accepts POST. Returns 405 for other methods.
 * - Determines an email for the account from (in order):
 *    1) a validated one-time token (if you implement token verification)
 *    2) a Stripe Checkout session (if session_id provided and STRIPE_SECRET_KEY is configured)
 * - Looks up or creates the user record and saves a password hash.
 * - Responds with JSON { ok: true } on success or { error: "message" } with appropriate HTTP status.
 *
 * SECURITY NOTE:
 * - This file includes placeholders for DB lookups and token verification. Replace those sections
 *   with your real user/store logic (Prisma, Mongoose, Supabase, etc.) before using in production.
 * - Do NOT use the Stripe session_id as a long-lived authentication token. Prefer creating one-time
 *   server-generated tokens and verifying them here (or use a verified email link flow).
 */

import bcrypt from 'bcryptjs';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

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

  // 1) If you use your own one-time tokens for setting password, verify them here.
  // Example placeholder:
  if (token) {
    // TODO: Replace with your real token verification logic.
    // Example (pseudo):
    // const payload = verifyOneTimeToken(token);
    // if (!payload || !payload.email) return res.status(400).json({ error: 'Invalid token' });
    // email = payload.email;
    //
    // For now, we'll not accept tokens unless you implement verifyOneTimeToken.
    // If you plan to use tokens, implement and set `email` from the token payload.
    console.warn('pages/api/set-password: token support requires server-side implementation.');
  }

  // 2) If no token, and a Stripe secret key is configured, try to pull the Checkout session to get customer email.
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
    // If you don't have an email, you can't reliably attach a password. Return error.
    // If your flow uses a different identifier, adapt this section accordingly.
    return res.status(400).json({ error: 'Unable to determine account email. Provide a valid token or session_id.' });
  }

  try {
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // TODO: Replace the pseudo DB code below with your real DB / user-store logic.
    // Examples for common stacks (pseudocode):
    //
    // Prisma (example):
    // import prisma from '../../lib/prisma';
    // let user = await prisma.user.findUnique({ where: { email } });
    // if (!user) {
    //   user = await prisma.user.create({ data: { email, passwordHash } });
    // } else {
    //   user = await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    // }
    //
    // Mongoose (example):
    // import User from '../../models/User';
    // let user = await User.findOne({ email });
    // if (!user) {
    //   user = await User.create({ email, passwordHash });
    // } else {
    //   user.passwordHash = passwordHash;
    //   await user.save();
    // }
    //
    // Supabase / Postgres / other: perform equivalent upsert/update operations and persist the password hash.
    //
    // For now (no DB configured), we log the email and return success for testing.
    console.info(`SET-PASSWORD (demo): would set password for ${email}`);

    // If you want to return helpful info (do not expose sensitive data)
    return res.status(200).json({ ok: true, email });
  } catch (err) {
    console.error('Error setting password', err);
    return res.status(500).json({ error: 'Failed to set password' });
  }
}
