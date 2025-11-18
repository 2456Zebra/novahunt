import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { setEmail(''); setPassword(''); setError(''); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: String(email || '').trim(), password }) });
      const body = await res.json();
      if (!res.ok) { setError(body?.error || 'Could not create account.'); setLoading(false); return; }
      try { await signIn('credentials', { redirect: false, email: String(email || '').trim(), password }); } catch (_) {}
      router.replace('/');
    } catch (err) { setError('Server error, please try again.'); setLoading(false); }
  }

  return (
    <main className="container">
      <h1>Create account</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <label>Email<input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required autoComplete="email"/></label>
        <label>Password<input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required autoComplete="new-password"/></label>
        {error && <div className="error" role="alert">{error}</div>}
        <div><button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button></div>
      </form>
    </main>
  );
}
