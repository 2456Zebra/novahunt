import { randomBytes, scryptSync } from 'crypto';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

/**
 * POST /api/set-password
 *
 * This implementation uses Node's built-in crypto (scrypt) instead of bcryptjs
 * so you don't need to add a new dependency. It:
 * - Accepts POST only (405 for others)
 * - Validates password length
 * - Tries to resolve the account email from a one-time token (not implemented)
 *   or from a Stripe Checkout session_id (if provided and STRIPE_SECRET_KEY is set)
 * - Hashes password with salt using scryptSync and returns success.
 *
 * IMPORTANT:
 * Replace the TODO DB sections with your real DB upsert/update logic (Prisma, Mongoose, Supabase, etc.).
 * Do NOT treat Stripe session_id as an authentication token in production — prefer a server-generated
 * one-time token emailed to the user or verify ownership server-side before updating a password.
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
    // TODO: verify token and extract email from payload
    // Example pseudo:
    // const payload = verifyOneTimeToken(token);
    // if (!payload || !payload.email) return res.status(400).json({ error: 'Invalid token' });
    // email = payload.email;
    console.warn('pages/api/set-password: token support requires server-side implementation.');
  }

  // 2) Try Stripe Checkout session to get customer email
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

  try {
    // Hash password using scrypt with a random salt.
    const salt = randomBytes(16).toString('hex'); // 32 chars
    const derivedKey = scryptSync(password, salt, 64); // 64 bytes
    const passwordHash = `${salt}:${derivedKey.toString('hex')}`;

    // TODO: Replace with your actual DB logic to create or update a user record.
    // Example pseudocode (Prisma):
    // import prisma from '../../lib/prisma';
    // let user = await prisma.user.findUnique({ where: { email } });
    // if (!user) {
    //   user = await prisma.user.create({ data: { email, passwordHash } });
    // } else {
    //   user = await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    // }
    //
    // Example pseudocode (Mongoose):
    // import User from '../../models/User';
    // let user = await User.findOne({ email });
    // if (!user) {
    //   user = await User.create({ email, passwordHash });
    // } else {
    //   user.passwordHash = passwordHash;
    //   await user.save();
    // }

    // For demo/testing (no DB configured) just log and return success.
    console.info(`SET-PASSWORD (demo): would set password for ${email}`);

    return res.status(200).json({ ok: true, email });
  } catch (err) {
    console.error('Error setting password', err);
    return res.status(500).json({ error: 'Failed to set password' });
  }
}
