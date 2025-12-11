import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SetPassword() {
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const router = useRouter();
  const email = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('email') || '' : '';

  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 8) return setMsg('Password too short');

    const r = await fetch('/api/auth/set-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, password: pw })
    });

    if (r.ok) {
      router.push('/dashboard');
    } else {
      setMsg('Error – try again');
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '100px auto', textAlign: 'center' }}>
      <h1>Set Password</h1>
      <p>Welcome <strong>{email || '...'}</strong></p>
      <form onSubmit={submit}>
        <input
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          placeholder="Choose password (8+ chars)"
          required
          minLength={8}
          style={{ width: '100%', padding: 12, margin: '10px 0' }}
        />
        <button type="submit" style={{ width: '100%', padding: 12 }}>
          Continue
        </button>
      </form>
      {msg && <p style={{ marginTop: 20, color: msg.includes('Error') ? 'red' : 'green' }}>{msg}</p>}
    </div>
  );
}
