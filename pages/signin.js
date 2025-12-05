// pages/signin.js
// Prefills email/password from sessionStorage keys 'auth_prefill_email' and 'auth_prefill_password' (set by password-success).
// The user must click "Sign in" — no automatic redirect from this page.

import { useEffect, useState } from 'react';
import Router from 'next/router';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [prefilled, setPrefilled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    try {
      const prefEmail = sessionStorage.getItem('auth_prefill_email') || sessionStorage.getItem('auth_pending_email');
      const prefPassword = sessionStorage.getItem('auth_prefill_password') || sessionStorage.getItem('auth_pending_password');
      if (prefEmail) {
        setEmail(prefEmail);
        setPrefilled(true);
      }
      if (prefPassword) {
        setPassword(prefPassword);
        setPrefilled(true);
      }
      // Keep the prefill in sessionStorage until the user clicks Sign in — we will clear on success.
    } catch (err) {
      console.warn('sessionStorage read failed', err);
    }
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

      // Clear sensitive prefill values after sign-in attempt
      try {
        sessionStorage.removeItem('auth_prefill_email');
        sessionStorage.removeItem('auth_prefill_password');
        sessionStorage.removeItem('auth_pending_email');
        sessionStorage.removeItem('auth_pending_password');
      } catch (err) {}

      // Poll for session persistence briefly
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
