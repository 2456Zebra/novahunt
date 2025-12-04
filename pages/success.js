// Minimal Next.js success page that sets password then shows a Sign in button.
// Replace or merge into your existing success page. Adjust route '/signin' if your login route differs.

import { useState } from 'react';
import Router from 'next/router';

export default function SuccessPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null); // null | 'loading' | 'ok' | 'error'
  const [message, setMessage] = useState('');
  const [autoRedirectSeconds, setAutoRedirectSeconds] = useState(5);

  async function handleSubmit(e) {
    e && e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/set-password-by-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({ ok: false, message: 'Invalid response' }));

      if (res.ok && data.ok !== false) {
        setStatus('ok');
        setMessage(data.message || 'Password set successfully.');

        // Optional: auto-redirect after a short delay
        let sec = autoRedirectSeconds;
        const timer = setInterval(() => {
          sec -= 1;
          setAutoRedirectSeconds(sec);
          if (sec <= 0) {
            clearInterval(timer);
            Router.push('/signin'); // change to '/login' if needed
          }
        }, 1000);

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
    <div style={{ maxWidth: 680, margin: '48px auto', padding: 24, fontFamily: 'system-ui, Arial' }}>
      <h1>Payment successful</h1>
      <p>Thanks — your payment was successful. Set a password to sign in and access your account.</p>

      {status !== 'ok' && (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, marginTop: 18 }}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{ display: 'block', width: '100%', padding: '8px 10px', marginTop: 6 }}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a password"
              required
              style={{ display: 'block', width: '100%', padding: '8px 10px', marginTop: 6 }}
            />
          </label>

          <button type="submit" style={{ padding: '10px 14px', background: '#0b5fff', color: 'white', border: 'none', borderRadius: 6 }}>
            Submit
          </button>

          {status === 'loading' && <div>Working…</div>}
          {status === 'error' && <div style={{ color: 'crimson' }}>Error: {message}</div>}
        </form>
      )}

      {status === 'ok' && (
        <div style={{ marginTop: 20 }}>
          <div style={{ padding: 12, background: '#e6ffed', borderRadius: 6, border: '1px solid #b9f2c9' }}>
            <strong>{message}</strong>
            <div style={{ marginTop: 8 }}>
              <a href="/signin" style={{ display: 'inline-block', padding: '8px 12px', background: '#0b5fff', color: '#fff', borderRadius: 6, textDecoration: 'none' }}>
                Sign in
              </a>
              <span style={{ marginLeft: 12, color: '#666' }}>Or we will redirect you automatically in {autoRedirectSeconds}s</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
