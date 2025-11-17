// Protected debug endpoint. Only enabled if SECRET_DEBUG is set in env and matches ?secret=...
import { getUserByEmail, verifyPasswordForUser } from '../../../lib/user-store';

export default async function handler(req, res) {
  const secretEnv = process.env.SECRET_DEBUG;
  const provided = (req.query && req.query.secret) || (req.body && req.body.secret);
  if (!secretEnv || !provided || provided !== secretEnv) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const email = (req.query.email || req.body?.email || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ error: 'email required' });

    let exists = false;
    let passwordOk = false;
    let user = null;

    try {
      if (typeof getUserByEmail === 'function') {
        user = await getUserByEmail(email);
        exists = !!user;
      }
    } catch (e) {
      // ignore lookup errors, we'll still try password verify
    }

    if (req.query.password || req.body?.password) {
      const pw = req.query.password || req.body.password;
      try {
        passwordOk = !!(await verifyPasswordForUser(email, pw));
      } catch (e) {
        return res.status(500).json({ error: 'verifyPasswordForUser threw', detail: String(e?.message || e) });
      }
    }

    return res.status(200).json({ ok: true, email, exists: !!user, passwordOk });
  } catch (err) {
    console.error('debug/user-exists error', err?.message || err);
    return res.status(500).json({ error: 'Server error' });
  }
}
