import { useEffect, useState } from 'react';
import Router from 'next/router';

// pages/signin.js
// Reads sessionStorage keys auth_prefill_email and auth_prefill_password (set by password-success)
// and pre-fills the signin form. The password is kept in sessionStorage only until the user submits,
// then both prefill keys are removed for safety.

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [prefilled, setPrefilled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // If the password-success placed prefill values, read them and prefill the form.
    const prefEmail = sessionStorage.getItem('auth_prefill_email');
    const prefPassword = sessionStorage.getItem('auth_prefill_password');
    if (prefEmail) {
      setEmail(prefEmail);
      setPrefilled(true);
    }
    if (prefPassword) {
      setPassword(prefPassword);
      setPrefilled(true);
    }
    // Do NOT remove them here — keep them until user submits (or until they navigate away).
    // We'll clear them on successful sign-in or after form submit attempt.
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      if (!window.supabase?.auth?.signInWithPassword) {
        setMessage('Supabase client not ready.');
        setLoading(false);
        return;
      }

      const { data, error } = await window.supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message || 'Sign in failed.');
        setLoading(false);
        return;
      }

      // Clear the prefill values (security)
      sessionStorage.removeItem('auth_prefill_email');
      sessionStorage.removeItem('auth_prefill_password');

      // Wait briefly for session persistence before navigating
      let attempts = 0;
      const maxAttempts = 20;
      let sessionFound = false;
      while (attempts < maxAttempts) {
        // eslint-disable-next-line no-await-in-loop
        const s = await window.supabase.auth.getSession();
        if (s?.data?.session?.user) {
          sessionFound = true;
          break;
        }
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 200));
        attempts += 1;
      }

      if (sessionFound) {
        Router.push('/dashboard');
      } else {
        // fallback navigation
        Router.push('/');
      }
    } catch (err) {
      setMessage(String(err?.message || err));
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: '48px auto', padding: 20 }}>
      <h1>Sign in</h1>

      {prefilled && (
        <div style={{ marginBottom: 12, color: '#374151' }}>
          We pre-filled your email{password ? ' and password' : ''}. Click Sign in to continue.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        <label>
          Password
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        <div>
          <button type="submit" style={{ padding: '10px 14px', background: '#0b5fff', color: '#fff', border: 0, borderRadius: 6 }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </div>

        {message && <div style={{ color: 'crimson' }}>{message}</div>}
      </form>
    </main>
  );
}
