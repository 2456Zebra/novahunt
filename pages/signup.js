// pages/signup.js
import React, { useState } from 'react';
import Nav from '../components/Nav';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);
    if (!email) { setMsg({ type: 'error', text: 'Email is required.' }); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const text = await res.text().catch(()=>null);
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch {}
      if (res.ok) {
        setMsg({ type: 'success', text: (json && json.message) ? json.message : 'Account created.' });
        setTimeout(()=> { window.location.href = '/signin'; }, 1200);
      } else {
        const err = (json && json.error) ? json.error : (text || res.statusText || `Error ${res.status}`);
        setMsg({ type: 'error', text: err });
      }
    } catch (err) {
      console.error('Signup failed', err);
      setMsg({ type: 'error', text: 'Unable to sign up. Check console.' });
    } finally { setLoading(false); }
  }

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <Nav />
      <main style={{ maxWidth: 680, margin: '32px auto', padding: 20 }}>
        <h1>Sign Up</h1>
        <p>Create your account to get started.</p>
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
          <button type="submit" disabled={loading} style={{ padding: '8px 14px' }}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
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