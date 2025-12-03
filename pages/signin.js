import React, { useState } from 'react';
import { useRouter } from 'next/router';
import supabase from '../lib/supabaseClient';
import Link from 'next/link';

export default function SigninPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setErr(error.message || 'Sign-in failed');
      } else {
        // sign-in successful — Supabase stores session in localStorage automatically
        router.push('/');
      }
    } catch (e) {
      setErr(e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '40px auto', padding: 20 }}>
      <h1>Sign in</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={{ display: 'flex', flexDirection: 'column' }}>
          Email
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: 8, fontSize: 14 }} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column' }}>
          Password
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: 8, fontSize: 14 }} />
        </label>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="submit" disabled={loading} style={{ padding: '8px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6 }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <Link href="/signup"><a style={{ color: '#2563eb' }}>Sign up</a></Link>
        </div>

        {err ? <div style={{ color: 'red' }}>{err}</div> : null}
      </form>
    </div>
  );
}
