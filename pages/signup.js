// pages/signup.js
// Full Create Account page (client-side Supabase signUp).
// Replace the redirect file with this if you want /signup to display the signup form.

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import supabase from '../lib/supabaseClient';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (!email || !password) {
      setErr('Email and password are required.');
      return;
    }
    if (password !== confirm) {
      setErr('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        setErr(error.message || 'Signup failed');
      } else {
        setMsg('Signup successful. If your project requires email confirmation, check your inbox. You can sign in now.');
        setTimeout(() => router.push('/plans'), 1200);
      }
    } catch (e) {
      setErr(e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '40px auto', padding: 20 }}>
      <h1>Create account</h1>
      <p>Create an account to reveal more contacts.</p>

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
          Confirm password
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required style={{ padding: 8, fontSize: 14 }} />
        </label>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="submit" disabled={loading} style={{ padding: '8px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6 }}>
            {loading ? 'Signing up…' : 'Sign up'}
          </button>
          <Link href="/plans"><a style={{ color: '#2563eb' }}>Choose a plan</a></Link>
        </div>

        {msg ? <div style={{ color: 'green' }}>{msg}</div> : null}
        {err ? <div style={{ color: 'red' }}>{err}</div> : null}
      </form>

      <div style={{ marginTop: 12 }}>
        Already have an account? <Link href="/signin"><a style={{ color: '#2563eb' }}>Sign in</a></Link>
      </div>
    </div>
  );
}
