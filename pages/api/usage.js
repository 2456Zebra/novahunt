import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { incrementUsage } from '../../lib/user-store';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    // Get authenticated session
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.email) {
      return res.status(401).json({ ok: false, error: 'Authentication required' });
    }

    const { type, amount } = req.body;
    const email = session.user.email.toLowerCase();

    // Validate type
    if (!type || (type !== 'search' && type !== 'reveal')) {
      return res.status(400).json({ ok: false, error: 'Invalid type. Must be "search" or "reveal"' });
    }

    // Increment usage
    const incrementAmount = amount ?? 1;
    const usage = await incrementUsage(email, type, incrementAmount);

    if (!usage) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    return res.status(200).json({ ok: true, usage });
  } catch (err) {
    console.error('usage endpoint error', err?.message || err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
