// pages/set-password.js
// Sets both auth_pending_* and auth_prefill_* before redirecting to password-success.
// This ensures the credentials survive the flow even if password-success clears pending.

import { useEffect, useState } from 'react';

export default function SetPasswordPage() {
  const [email, setEmail] = useState('');
  const [emailReadonly, setEmailReadonly] = useState(false);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null); // null | 'loading' | 'ok' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    try {
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const eParam = params?.get('email') || params?.get('customer_email') || params?.get('checkout_email');
      if (eParam) {
        setEmail(eParam);
        setEmailReadonly(true);
        try { sessionStorage.setItem('stripe_email', eParam); } catch (e) {}
        return;
      }

      const fromSession = typeof window !== 'undefined' ? sessionStorage.getItem('stripe_email') : null;
      if (fromSession) {
        setEmail(fromSession);
        setEmailReadonly(true);
        return;
      }

      const pending = typeof window !== 'undefined' ? sessionStorage.getItem('auth_pending_email') : null;
      if (pending) {
        setEmail(pending);
        setEmailReadonly(true);
      }
    } catch (err) {
      console.warn('prefill email error', err);
    }
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
        try {
          // Persist both "pending" (for immediate auto sign-in) and "prefill" (for fallback Sign In page).
          sessionStorage.setItem('auth_pending_email', email);
          sessionStorage.setItem('auth_pending_password', password);
          sessionStorage.setItem('auth_prefill_email', email);
          sessionStorage.setItem('auth_prefill_password', password);
        } catch (err) {
          console.warn('sessionStorage write failed', err);
        }

        // Use replace so navigation is clean and avoids extra history entries.
        window.location.replace('/password-success?redirectTo=/dashboard&seconds=5');
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
    <div className="setpw-root">
      <div className="setpw-card">
        <h1>Set a password</h1>

        <p className="setpw-sub">
          {email ? `We found your email: ${email}. Only choose a password.` : 'Enter your email and choose a password.'}
        </p>

        <form onSubmit={handleSubmit} className="setpw-form">
          <label className="setpw-label">
            Email
            <input
              className="setpw-input"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              readOnly={emailReadonly}
              placeholder="you@example.com"
            />
          </label>

          <label className="setpw-label">
            Password
            <input
              className={`setpw-input ${password ? '' : 'setpw-required'}`}
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Choose a password"
              autoFocus
            />
          </label>

          <div className="setpw-actions">
            <button type="submit" className="setpw-btn">Set password</button>
          </div>

          {status === 'loading' && <div className="setpw-note">Working…</div>}
          {status === 'error' && <div className="setpw-error">Error: {message}</div>}
        </form>
      </div>
    </div>
  );
}
