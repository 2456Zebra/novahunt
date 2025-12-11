import { useState } from 'react';

export default function SetPassword() {
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const email = new URLSearchParams(location.search).get('email') || '';

  const submit = async (e) => {
    e.preventDefault();
    const r = await fetch('/api/auth/set-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, password: pw })
    });
    if (r.ok) location.href = '/dashboard';
    else setMsg('Error');
  };

  return (
    <form onSubmit={submit}>
      <p>Welcome {email}</p>
      <input type="password" value={pw} onChange={e=>setPw(e.target.value)} required minLength={8} />
      <button type="submit">Set Password & Continue</button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
