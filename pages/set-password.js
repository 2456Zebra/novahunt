// pages/set-password.js
// Page for users to set a password after Stripe signup (or via emailed token).
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function SetPasswordPage() {
  const router = useRouter();
  const { email: qEmail, token: qToken } = router.query;

  const [email, setEmail] = useState(qEmail || '');
  const [token, setToken] = useState(qToken || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (qEmail) setEmail(qEmail);
    if (qToken) setToken(qToken);
  }, [qEmail, qToken]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, token }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json && json.error ? json.error : 'Failed to set password.');
      } else {
        setMessage('Password set successfully. You may now sign in.');
        // optionally redirect to sign in after short delay
        setTimeout(() => router.push('/signin'), 1200);
      }
    } catch (err) {
      setError(err && err.message ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '40px auto', padding: 20 }}>
      <h1>Set your password</h1>
      <p>If you completed checkout, enter your email and choose a password.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={{ display: 'flex', flexDirection: 'column' }}>
          Email
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: 8, fontSize: 14 }} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column' }}>
          Password
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: 8, fontSize: 14 }} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column' }}>
          Confirm Password
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required style={{ padding: 8, fontSize: 14 }} />
        </label>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="submit" disabled={loading} style={{ padding: '8px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6 }}>
            {loading ? 'Saving…' : 'Set password'}
          </button>
          <Link href="/"><a style={{ color: '#2563eb' }}>Return home</a></Link>
        </div>

        {message ? <div style={{ color: 'green' }}>{message}</div> : null}
        {error ? <div style={{ color: 'red' }}>{error}</div> : null}
      </form>
    </div>
  );
}
