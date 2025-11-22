import React, { useState } from 'react';
import { useRouter } from 'next/router';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e && e.preventDefault && e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Signup failed');
      // server sets nh_session cookie; redirect to account
      router.replace('/account');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 640, margin: '40px auto' }}>
      <h1>Create an account</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <label style={{ fontSize: 14 }}>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="you@example.com"
          required
          style={{ padding: '12px 14px', fontSize: 16, borderRadius: 8, border: '1px solid #e6e6e6' }}
        />

        <label style={{ fontSize: 14 }}>Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Choose a strong password"
          required
          style={{ padding: '12px 14px', fontSize: 16, borderRadius: 8, border: '1px solid #e6e6e6' }}
        />

        {error ? <div style={{ color: 'red' }}>{error}</div> : null}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" style={{ flex: 1, padding: '12px 14px', borderRadius: 8, background: '#111827', color: '#fff', border: 'none' }} disabled={busy}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </div>

        <div style={{ color: '#6b7280', fontSize: 13 }}>
          By signing up you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy policy</a>.
        </div>
      </form>
    </main>
  );
}
