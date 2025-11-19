import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { getUserByEmail } from '../../lib/user-store';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    // Get authenticated session
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.email) {
      return res.status(401).json({ ok: false, error: 'Authentication required' });
    }

    const email = session.user.email.toLowerCase();
    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    // Return minimal user info (email + usage)
    const accountInfo = {
      email: user.email,
      usage: user.usage || { searches: 0, reveals: 0 }
    };

    return res.status(200).json({ ok: true, account: accountInfo });
  } catch (err) {
    console.error('account endpoint error', err?.message || err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
