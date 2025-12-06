import { randomBytes, scryptSync } from 'crypto';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret-change-me';

/**
 * POST /api/set-password
 * - Accepts { password, session_id?, token? }
 * - Hashes password, upserts user in DB (TODO), then issues a JWT and sets an HttpOnly cookie.
 * - Returns { ok: true, redirect: "/dashboard" } on success.
 *
 * IMPORTANT:
 * - Replace the TODO DB upsert sections with your actual DB logic (Prisma/Mongoose/etc).
 * - Use a strong JWT_SECRET in production and store it in Vercel env vars.
 * - Do NOT treat Stripe session_id as authentication in production; verify ownership or use one-time tokens.
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

  // 1) If you implement token-based flow, verify token and set email here.
  if (token) {
    // TODO: verify token, set email from payload
    // const payload = verifyToken(token);
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

  try {
    // Hash password using scrypt + salt
    const salt = randomBytes(16).toString('hex'); // 32 chars
    const derived = scryptSync(password, salt, 64); // 64 bytes
    const passwordHash = `${salt}:${derived.toString('hex')}`;

    // TODO: Replace this block with your DB upsert / update logic
    // Example pseudocode:
    // let user = await db.users.findOne({ email });
    // if (!user) {
    //   user = await db.users.create({ email, passwordHash });
    // } else {
    //   user = await db.users.update({ id: user.id }, { passwordHash });
    // }
    //
    // Also, set user.id variable to use in the token below.

    // For demo/testing only (no DB), generate a fake user id:
    const userId = `demo-${email}`;

    console.info(`SET-PASSWORD: would set password for ${email}`);

    // Issue a JWT for the session (short-lived or as you prefer)
    const tokenPayload = { sub: userId, email };
    const jwtOptions = { expiresIn: '7d' }; // adjust as needed
    const authToken = jwt.sign(tokenPayload, JWT_SECRET, jwtOptions);

    // Set cookie (HttpOnly, Secure in production)
    const secure = process.env.NODE_ENV === 'production';
    const cookieParts = [
      `auth=${authToken}`,
      'HttpOnly',
      'Path=/',
      `Max-Age=${7 * 24 * 60 * 60}`, // 7 days
      'SameSite=Lax',
    ];
    if (secure) cookieParts.push('Secure');

    res.setHeader('Set-Cookie', cookieParts.join('; '));

    // Return redirect target for client to navigate to
    return res.status(200).json({ ok: true, redirect: '/dashboard', email });
  } catch (err) {
    console.error('Error setting password', err);
    return res.status(500).json({ error: 'Failed to set password' });
  }
}
