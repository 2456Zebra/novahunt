'use client';

import { useState } from 'react';
import { signUp } from '../utils/auth';
import Link from 'next/link';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await signUp({ email, password });
      window.location.href = '/';
    } catch (e) {
      setErr(e.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: '56px auto', padding: '0 16px' }}>
      <h1>Sign up</h1>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input required type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <div style={{ color: 'crimson' }}>{err}</div>}
        <button disabled={loading} type="submit" className="btn btn-primary">{loading ? 'Creating…' : 'Create account'}</button>
      </form>
      <p style={{ marginTop: 12 }}>
        Already have an account? <Link href="/signin"><a>Sign in</a></Link>
      </p>
    </main>
  );
}
