import jwt from 'jsonwebtoken';

/**
 * GET /api/me
 * - Reads the "auth" HttpOnly cookie (JWT) and verifies it.
 * - Returns { authenticated: boolean, user?: { id, email } }
 *
 * Must match the JWT signing secret (JWT_SECRET or NEXTAUTH_SECRET)
 */
export default function handler(req, res) {
  const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret-change-me';

  const token = (req.cookies && req.cookies.auth) || null;

  if (!token) {
    return res.status(200).json({ authenticated: false });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = { id: payload.sub, email: payload.email };
    return res.status(200).json({ authenticated: true, user });
  } catch (err) {
    console.warn('api/me: token verify failed', err && err.message);
    return res.status(200).json({ authenticated: false });
  }
}
