// pages/set-password.js
// Prefills email (from sessionStorage 'stripe_email' or URL param 'email' or previous auth_pending),
// only requires the user to enter a password. On success stores pending credentials to sessionStorage
// and redirects to /password-success?redirectTo=/dashboard&seconds=5

import { useEffect, useState } from 'react';

export default function SetPasswordPage() {
  const [email, setEmail] = useState('');
  const [emailReadonly, setEmailReadonly] = useState(false);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null); // null | 'loading' | 'ok' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Priority: sessionStorage.stripe_email -> URL param 'email' -> sessionStorage.auth_pending_email
    try {
      const fromSession = sessionStorage.getItem('stripe_email');
      if (fromSession) {
        setEmail(fromSession);
        setEmailReadonly(true);
        return;
      }
    } catch (e) { /* ignore sessionStorage read errors */ }

    // URL param
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const eParam = params.get('email') || params.get('customer_email');
      if (eParam) {
        setEmail(eParam);
        setEmailReadonly(true);
        return;
      }
    }

    // fallback to any auth_pending_email (e.g., user returned mid-flow)
    try {
      const pending = sessionStorage.getItem('auth_pending_email');
      if (pending) {
        setEmail(pending);
        setEmailReadonly(true);
      }
    } catch (e) {}
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/set-password-by-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json().catch(() => ({ ok: false, message: 'Invalid response' }));

      if (res.ok && data.ok !== false) {
        // Save pending credentials to sessionStorage (tab-scoped) for password-success auto sign-in
        try {
          sessionStorage.setItem('auth_pending_email', email);
          sessionStorage.setItem('auth_pending_password', password);
        } catch (err) {
          console.warn('sessionStorage write failed', err);
        }

        // Redirect to success page (it will attempt auto sign-in and then redirect to dashboard)
        window.location.href = '/password-success?redirectTo=/dashboard&seconds=5';
        setStatus('ok');
        setMessage(data.message || 'Password set. Redirecting…');
      } else {
        setStatus('error');
        setMessage(data.error || data.message || JSON.stringify(data));
      }
    } catch (err) {
      setStatus('error');
      setMessage(String(err.message || err));
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '48px auto', padding: 24 }}>
      <h1>Set a password</h1>
      <p style={{ color: '#374151', marginTop: 0 }}>
        Enter a password for {emailReadonly ? 'your account' : 'your email address'} below.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <label>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            readOnly={emailReadonly}
            placeholder="you@example.com"
            style={{ display: 'block', width: '100%', padding: '8px 10px', marginTop: 6 }}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Choose a password"
            style={{ display: 'block', width: '100%', padding: '8px 10px', marginTop: 6 }}
          />
        </label>

        <div>
          <button
            type="submit"
            style={{ padding: '10px 14px', background: '#0b5fff', color: '#fff', border: 'none', borderRadius: 6 }}
          >
            Set password
          </button>
        </div>

        {status === 'loading' && <div>Working…</div>}
        {status === 'error' && <div style={{ color: 'crimson' }}>Error: {message}</div>}
      </form>
    </div>
  );
}
