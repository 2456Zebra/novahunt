import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function SetPasswordPage() {
  const router = useRouter();
  const { token: tokenQuery } = router.query || {};
  const [token, setToken] = useState(tokenQuery || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (tokenQuery) setToken(tokenQuery);
  }, [tokenQuery]);

  async function submit(e) {
    e.preventDefault();
    if (!token) return setMessage('Missing token.');
    if (password.length < 8) return setMessage('Password must be at least 8 characters.');
    if (password !== confirm) return setMessage('Passwords do not match.');

    setStatus('working');
    setMessage('');
    try {
      const res = await fetch('/api/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const body = await res.json();
      if (!res.ok) {
        setStatus('error');
        setMessage(body?.error || 'Could not set password');
        return;
      }

      // store nh_session so the app recognizes the user as signed in
      if (body && body.nh_session) {
        try {
          localStorage.setItem('nh_session', body.nh_session);
        } catch (e) {
          // ignore
        }
      }

      setStatus('done');
      setMessage('Password set. Redirecting to dashboard…');
      setTimeout(() => {
        window.location.href = '/';
      }, 900);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage(err?.message || 'Network error');
    }
  }

  return (
    <main style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <h1>Set your password</h1>
      <p>Enter a password to secure your account.</p>

      <form onSubmit={submit} style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
        <input type="hidden" value={token} />
        <label>
          New password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} style={{ width: '100%', padding: 8 }} />
        </label>
        <label>
          Confirm password
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} style={{ width: '100%', padding: 8 }} />
        </label>

        <div>
          <button type="submit" disabled={status === 'working'} style={{ padding: '8px 12px' }}>
            {status === 'working' ? 'Setting…' : 'Set password'}
          </button>
        </div>

        {message && <div style={{ color: status === 'error' ? '#ef4444' : '#111827' }}>{message}</div>}
      </form>

      <div style={{ marginTop: 18, color: '#6b7280' }}>
        If the token has expired, request a new password set link via your account settings or contact support@novahunt.ai.
      </div>
    </main>
  );
}
