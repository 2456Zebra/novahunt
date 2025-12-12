'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';

export default function SetPassword() {
  const router = useRouter();
  const { email, session_id } = router.query; // ← THIS LINE IS THE FIX

  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 8) return setMsg('Password too short');

    const res = await fetch('/api/auth/set-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, password: pw, session_id }), // ← passes session_id
    });

    if (res.ok) {
      router.push('/dashboard');
    } else {
      setMsg('Verification failed – please try again');
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '100px auto', textAlign: 'center', fontFamily: 'system-ui' }}>
      <h1>Set Password</h1>
      <p>Welcome <strong>{email || '...'}</strong></p>
      <form onSubmit={submit}>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Choose password (8+ chars)"
          required
          minLength={8}
          style={{ width: '100%', padding: 14, fontSize: 16, margin: '10px 0' }}
        />
        <button type="submit" style={{ width: '100%', padding: 14, background: '#0066ff', color: 'white', border: 'none', fontSize: 16 }}>
          Continue → Dashboard
        </button>
      </form>
      {msg && <p style={{ marginTop: 20, color: 'red' }}>{msg}</p>}
    </div>
  );
}
