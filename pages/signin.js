import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function SigninPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json();
      if (!res.ok) {
        setMessage(body.error || 'Signin failed');
        setBusy(false);
        return;
      }
      // Success: redirect to homepage or ?redirect=
      const redirect = (router.query && router.query.redirect) || '/';
      router.push(redirect);
    } catch (err) {
      setMessage(String(err?.message || err));
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '24px auto', padding: 20 }}>
      <h1>Sign in</h1>
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px 10px', marginTop: 6 }}
          />
        </label>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px 10px', marginTop: 6 }}
          />
        </label>

        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={busy} style={{ padding: '8px 12px' }}>
            {busy ? 'Signing in...' : 'Sign in'}
          </button>
          <Link href="/signup"><a style={{ marginLeft: 12 }}>Create account</a></Link>
        </div>
      </form>

      {message && <div style={{ marginTop: 12, color: 'crimson' }}>{message}</div>}
    </div>
  );
}
