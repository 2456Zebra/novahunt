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

    // Find the user (created by webhook)
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return new Response('User not found', { status: 400 });
    }

    // SET THE PASSWORD FIRST (this was missing)
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, { password });
    if (updateError) {
      console.error('Update password error:', updateError);
      return new Response('Password update failed', { status: 500 });
    }

    // Now sign in with the new password
    const { data: { session: authSession } } = await supabase.auth.signInWithPassword({ email, password });

    if (!authSession) {
      return new Response('Login failed', { status: 500 });
    }

    const { access_token, refresh_token, expires_in } = authSession;

    const headers = new Headers();
    headers.append('Set-Cookie', `sb-access-token=${access_token}; Path=/; Domain=novahunt.ai; HttpOnly; Secure; SameSite=Lax; Max-Age=${expires_in}`);
    headers.append('Set-Cookie', `sb-refresh-token=${refresh_token}; Path=/; Domain=novahunt.ai; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`);
    headers.append('Location', '/dashboard');

    return new Response(null, { status: 302, headers });
  } catch (err) {
    console.error('Set-password error:', err);
    return new Response('Verification failed', { status: 500 });
  }
}
