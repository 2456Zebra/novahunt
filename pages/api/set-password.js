import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const anon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const delay = ms => new Promise(r => setTimeout(r, ms));

async function waitForUser(email, attempts = 15) {
  for (let i = 0; i < attempts; i++) {
    const { data } = await supabaseAdmin.auth.admin.listUsers();
    const user = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (user) return user;
    await delay(600 * Math.pow(1.6, i));
  }
  throw new Error('User never appeared');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;
  if (!email || !password || password.length < 8)
    return res.status(400).json({ error: 'Invalid request' });

  let user;
  try {
    user = await waitForUser(email);
  } catch (e) {
    console.error('[set-password] User not found after retries');
    return res.status(500).json({ error: 'User not ready' });
  }

  // Update password
  const { error: upd } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password });
  if (upd) {
    console.error('[set-password] updateUser failed', upd);
    return res.status(500).json({ error: 'Password update failed' });
  }

  // Sign in + set HttpOnly cookies
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    console.error('[set-password] signIn failed', error);
    return res.status(500).json({ error: 'Login failed' });
  }

  const { access_token, refresh_token, expires_in } = data.session;

  res.setHeader('Set-Cookie', [
    `sb-access-token=${access_token}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${expires_in}`,
    `sb-refresh-token=${refresh_token}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${60*60*24*365}`,
  ]);

  console.log('[set-password] SUCCESS – auto-signed in');
  res.status(200).json({ success: true });
}

export const config = { api: { bodyParser: true } };
