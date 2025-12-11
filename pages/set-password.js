import { useState } from 'react';
import { useRouter } from 'next/router';

export default function SetPassword() {
  const router = useRouter();
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const email = params.get('email') || '';
  const sessionId = params.get('session_id') || '';

  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 8) return setMsg('Password too short');

    const r = await fetch('/api/auth/set-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, password: pw, session_id: sessionId }),
    });

    if (r.ok) {
      router.push('/dashboard');
    } else {
      setMsg('Verification failed – please try again');
    }
  };

  return (
    <div style={{maxWidth:420, margin:'100px auto', textAlign:'center'}}>
      <h1>Set Password</h1>
      <p>Welcome {email}</p>
      <form onSubmit={submit}>
        <input type="password" value={pw} onChange={e=>setPw(e.target.value)} required minLength={8} placeholder="Choose password" />
        <button type="submit">Continue → Dashboard</button>
      </form>
      {msg && <p style={{color:'red', marginTop:20}}>{msg}</p>}
    </div>
  );
}
