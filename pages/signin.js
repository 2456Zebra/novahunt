// pages/signin.js
import React, { useState } from 'react';
import Nav from '../components/Nav';

export default function SigninPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);
    if (!email) { setMsg({ type: 'error', text: 'Email is required.' }); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const text = await res.text().catch(()=>null);
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch {}
      if (res.ok) {
        setMsg({ type: 'success', text: (json && json.message) ? json.message : 'Signed in.' });
        setTimeout(()=> { window.location.href = '/'; }, 800);
      } else {
        const err = (json && json.error) ? json.error : (text || res.statusText || `Error ${res.status}`);
        setMsg({ type: 'error', text: err });
      }
    } catch (err) {
      console.error('Signin failed', err);
      setMsg({ type: 'error', text: 'Unable to sign in. Check console.' });
    } finally { setLoading(false); }
  }

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <Nav />
      <main style={{ maxWidth: 680, margin: '32px auto', padding: 20 }}>
        <h1>Sign In</h1>
        <p>Enter your email to sign in. We will send a magic link or session (depending on backend).</p>
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Email
            <input
              type="email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              required
              style={{ display: 'block', width: '100%', padding: 8, marginTop: 6 }}
            />
          </label>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button type="submit" disabled={loading} style={{ padding: '8px 14px' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <a href="/forgot-password">Forgot password?</a>
          </div>
        </form>

        {msg && (
          <div style={{ marginTop: 16, color: msg.type === 'error' ? '#a00' : '#080' }}>
            {msg.text}
          </div>
        )}
      </main>
    </div>
  );
}