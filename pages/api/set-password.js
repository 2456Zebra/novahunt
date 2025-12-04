// Example Set Password page (full file).
// This is a safe, client-side page that calls your /api/set-password-by-email endpoint.
// On success it stores the pending credentials in sessionStorage and redirects to /password-success.
//
// Replace or merge with your existing set-password page. Ensure you do NOT put the password
// in the URL (we use sessionStorage).

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
        // sessionStorage is scoped to the tab and will be cleared when used.
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
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
        </label>

        <button type="submit">Set password</button>

        {status === 'loading' && <div>Working…</div>}
        {status === 'error' && <div style={{ color: 'crimson' }}>Error: {message}</div>}
      </form>
    </div>
  );
}
