import { useEffect, useState } from 'react';
import Router from 'next/router';
import '../styles/set-password.css'; // ensure this file exists (you already added it to styles/)

export default function SetPasswordPage() {
  const [email, setEmail] = useState('');
  const [emailReadonly, setEmailReadonly] = useState(false);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null); // null | 'loading' | 'ok' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Priority: URL param 'email' (set by server redirect) -> sessionStorage.stripe_email -> fallback pending
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const eParam = params.get('email');
        if (eParam) {
          setEmail(eParam);
          setEmailReadonly(true);
          try { sessionStorage.setItem('stripe_email', eParam); } catch (e) { /* ignore */ }
          return;
        }

        const fromSession = sessionStorage.getItem('stripe_email');
        if (fromSession) {
          setEmail(fromSession);
          setEmailReadonly(true);
          return;
        }

        const pending = sessionStorage.getItem('auth_pending_email');
        if (pending) {
          setEmail(pending);
          setEmailReadonly(true);
        }
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
          sessionStorage.setItem('auth_pending_email', email);
          sessionStorage.setItem('auth_pending_password', password);
        } catch (err) {
          console.warn('sessionStorage write failed', err);
        }

        // Redirect to the success page which will attempt to sign-in automatically
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
