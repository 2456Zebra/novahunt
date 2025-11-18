import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setEmail(''); setPassword(''); setError(''); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await signIn('credentials', { redirect: false, email: String(email || '').trim(), password });
      if (res?.error) { setError(res.error || 'Signin failed.'); setLoading(false); return; }
      router.replace('/');
    } catch (err) { setError('Network or server error. Try again.'); setLoading(false); }
  }

  function goToCreateAccount() { router.push('/signup'); }

  return (
    <main className="container">
      <h1>Sign In</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <label>Email<input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required autoComplete="email"/></label>
        <label>Password<input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required autoComplete="current-password"/></label>
        {error && <div className="error" role="alert">{error}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
          <button type="button" onClick={goToCreateAccount}>Create account</button>
        </div>
      </form>
    </main>
  );
}
