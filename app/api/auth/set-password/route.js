import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const { email, password, session_id } = await req.json();

  if (!email || !password || !session_id) {
    return new Response('Missing data', { status: 400 });
  }

  try {
    // 1. Verify payment
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== 'paid') {
      return new Response('Payment not completed', { status: 400 });
    }

    // 2. Find user
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return new Response('User not found', { status: 400 });

    // 3. Set password
    await supabase.auth.admin.updateUserById(user.id, { password });

    // 4. Generate a fresh session using service role (bypasses all client checks)
    const { data: { session: authSession } } = await supabase.auth.signInWithPassword({ email, password });
    if (!authSession) throw new Error('Login failed');

    // 5. Set cookies + REDIRECT TO DASHBOARD (NO SIGN-IN PAGE)
    const headers = new Headers();
    headers.append('Set-Cookie', `sb-access-token=${authSession.access_token}; Path=/; Domain=.novahunt.ai; HttpOnly; Secure; SameSite=None; Max-Age=${authSession.expires_in}`);
    headers.append('Set-Cookie', `sb-refresh-token=${authSession.refresh_token}; Path=/; Domain=.novahunt.ai; HttpOnly; Secure; SameSite=None; Max-Age=31536000`);
    headers.append('Location', '/dashboard');

    return new Response(null, { status: 302, headers });
  } catch (err) {
    console.error('Set-password final error:', err);
    return new Response('Failed', { status: 500 });
  }
}
