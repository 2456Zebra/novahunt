import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * Set Password page
 * Flow:
 *  - Accepts ?email=...&session_id=... (Stripe checkout session_id optional)
 *  - POSTs to /api/auth/set-password (server should create the Supabase user via service role)
 *  - On success, performs client-side supabase.auth.signInWithPassword to obtain session tokens
 *  - Posts the session tokens to /api/auth/set-cookie (server sets HttpOnly cookies sb-access-token & sb-refresh-token)
 *  - Performs a full redirect to /account so middleware/SSR sees the cookies and header/pulldown is shown
 *
 * Note:
 *  - Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in env for the client sign-in step.
 *  - If client keys are not present, the page will attempt server user creation and then redirect to /account as a fallback.
 */

export default function SetPasswordPage() {
  const router = useRouter();
  const { email: qEmail, session_id: qSessionId } = router.query || {};
  const emailFromQuery = Array.isArray(qEmail) ? qEmail[0] : qEmail || '';
  const sessionIdFromQuery = Array.isArray(qSessionId) ? qSessionId[0] : qSessionId || '';

  const [email, setEmail] = useState(emailFromQuery);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (emailFromQuery) setEmail(emailFromQuery);
  }, [emailFromQuery]);

  async function finalizeSignInAndSetCookies(session) {
    if (!session) {
      console.error('No session available to set cookies.');
      return false;
    }

    const payload = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at || Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30),
    };

    try {
      const r = await fetch('/api/auth/set-cookie', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const txt = await r.text().catch(() => null);
        console.error('set-cookie failed', r.status, txt);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error calling set-cookie', err);
      return false;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setBusy(true);

    try {
      // 1) Create or ensure the user exists server-side
      const createRes = await fetch('/api/auth/set-password', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, session_id: sessionIdFromQuery }),
      });

      if (!createRes.ok) {
        const txt = await createRes.text().catch(() => null);
        setError(`Server create user failed: ${createRes.status} ${txt || ''}`);
        setBusy(false);
        return;
      }

      // 2) If client Supabase public keys are available, sign in client-side to get tokens
      const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const publicAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!publicUrl || !publicAnon) {
        // No client keys available in this environment — fallback: redirect to account and let server/session handle it if implemented
        setMessage('User created. Redirecting to your account...');
        // Small delay to let server-side cookie setting (if any) propagate
        setTimeout(() => {
          window.location.href = '/account';
        }, 400);
        return;
      }

      // Dynamically import supabase client to avoid bundling issues when env not present
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(publicUrl, publicAnon);

      // Use signInWithPassword (supabase-js v2)
      let signResult;
      try {
        const { data, error: signError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        signResult = { data, error: signError };
      } catch (err) {
        // fallback shape
        signResult = { data: null, error: err };
      }

      if (signResult.error) {
        console.error('Supabase signIn error', signResult.error);
        // Even if client sign-in fails, attempt to redirect — but report error to user
        setError('Sign-in failed: ' + (signResult.error.message || String(signResult.error)));
        setBusy(false);
        return;
      }

      // Extract session (support different return shapes)
      const session = signResult.data?.session || signResult.data || null;
      if (!session || !session.access_token) {
        console.warn('No session returned from supabase sign-in', signResult);
        setError('Sign-in returned no session.');
        setBusy(false);
        return;
      }

      // 3) Post tokens to server to set HttpOnly cookies
      await finalizeSignInAndSetCookies(session);

      // 4) Redirect to /account (full navigation so middleware picks up cookies)
      window.location.href = '/account';
    } catch (err) {
      console.error('Unexpected error in set-password flow', err);
      setError('Unexpected error. See console.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 700, margin: '2rem auto', fontFamily: 'system-ui, sans-serif', padding: '0 1rem' }}>
      <h1>Set your password</h1>
      <p>If you were redirected here after checkout, enter the password you'd like to use for this account.</p>

      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: 8 }}>
          Password
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            minLength={8}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <button type="submit" disabled={busy} style={{ padding: '10px 16px', cursor: busy ? 'default' : 'pointer' }}>
          {busy ? 'Working…' : 'Set password'}
        </button>
      </form>

      {message && <div style={{ marginTop: 16, padding: 12, background: '#eef', borderRadius: 6 }}>{String(message)}</div>}
      {error && <div style={{ marginTop: 16, padding: 12, background: '#fee', borderRadius: 6, color: '#900' }}>{String(error)}</div>}

      <p style={{ marginTop: 24, color: '#666' }}>
        If automatic sign-in fails, please sign in manually from the Sign in page.
      </p>
    </main>
  );
}
