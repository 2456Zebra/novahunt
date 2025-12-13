import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password, session_id } = req.body;

  if (!email || !password || !session_id) {
    return res.status(400).json({ error: 'Missing data' });
  }

  try {
    // Verify payment
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Find user
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) return res.status(400).json({ error: 'User not found' });

    // Set password
    await supabase.auth.admin.updateUserById(user.id, { password });

    // Sign in with new password
    const { data: { session: authSession } } = await supabase.auth.signInWithPassword({ email, password });
    if (!authSession) throw new Error('Login failed');

    // Set cookies
    res.setHeader('Set-Cookie', [
      `sb-access-token=${authSession.access_token}; Path=/; Domain=novahunt.ai; HttpOnly; Secure; SameSite=None; Max-Age=${authSession.expires_in}`,
      `sb-refresh-token=${authSession.refresh_token}; Path=/; Domain=novahunt.ai; HttpOnly; Secure; SameSite=None; Max-Age=31536000`,
    ]);

    return res.redirect(302, '/account');
  } catch (err) {
    console.error('Set-password error:', err);
    return res.status(500).json({ error: 'Failed' });
  }
}
