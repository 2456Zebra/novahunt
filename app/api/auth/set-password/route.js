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
    // Verify payment
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== 'paid') {
      return new Response('Payment not completed', { status: 400 });
    }

    // Find or create user
    const { data: { users } } = await supabase.auth.admin.listUsers();
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      const { data: newUser } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      user = newUser.user;
    } else {
      await supabase.auth.admin.updateUserById(user.id, { password });
    }

    // Sign in
    const { data: { session: authSession } } = await supabase.auth.signInWithPassword({ email, password });

    if (!authSession) throw new Error('Login failed');

    const headers = new Headers();
    headers.append('Set-Cookie', `sb-access-token=${authSession.access_token}; Path=/; Domain=novahunt.ai; HttpOnly; Secure; SameSite=Lax; Max-Age=${authSession.expires_in}`);
    headers.append('Set-Cookie', `sb-refresh-token=${authSession.refresh_token}; Path=/; Domain=novahunt.ai; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`);

    // Redirect directly to dashboard — NO sign-in page
    return new Response(null, {
      status: 302,
      headers: {
        ...Object.fromEntries(headers),
        Location: '/dashboard',
      },
    });
  } catch (err) {
    console.error('Set-password error:', err);
    return new Response('Verification failed', { status: 500 });
  }
}
