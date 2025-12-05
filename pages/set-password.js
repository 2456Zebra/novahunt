// pages/set-password.js
// A complete Set Password page that calls your /api/set-password-by-email.
// On success it saves the plaintext credentials to sessionStorage (tab-scoped) and
// redirects to /password-success which will attempt auto sign-in and then redirect to /dashboard.
//
// Important: the plaintext password is stored only in sessionStorage (not placed in any URL or server logs).
// sessionStorage is cleared by password-success after use.

import { useState } from 'react';

export default function SetPasswordPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null); // null | 'loading' | 'ok' | 'error'
  const [message, setMessage] = useState('');

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
        // Store pending credentials in sessionStorage for the password-success page to use.
        sessionStorage.setItem('auth_pending_email', email);
        sessionStorage.setItem('auth_pending_password', password);

        // Redirect to the success page which will perform automatic sign-in then redirect to dashboard
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
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <label>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
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
          <button type="submit" style={{ padding: '10px 14px', background: '#0b5fff', color: '#fff', border: 'none', borderRadius: 6 }}>
            Set password
          </button>
        </div>

        {status === 'loading' && <div>Working…</div>}
        {status === 'error' && <div style={{ color: 'crimson' }}>Error: {message}</div>}
      </form>
    </div>
  );
}
