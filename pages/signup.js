import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Always clear incoming prefilled data so users don't get stale credentials
  useEffect(() => {
    setEmail('');
    setPassword('');
    setError('');
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: String(email || '').trim(), password }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error || 'Could not create account.');
        setLoading(false);
        return;
      }

      // Auto-signin after signup using NextAuth
      try {
        const result = await signIn('credentials', {
          email: String(email || '').trim(),
          password,
          redirect: false,
        });
        if (result?.ok || !result?.error) {
          // Successfully signed in, redirect to dashboard
          router.replace('/');
          return;
        }
      } catch (_) {
        // ignore signin problems here; user can sign in manually
      }

      // Redirect to dashboard even if auto-signin failed
      router.replace('/');
    } catch (err) {
      setError('Server error, please try again.');
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <h1>Create account</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            required
            autoComplete="email"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            required
            autoComplete="new-password"
          />
        </label>

        {error && <div className="error" role="alert">{error}</div>}

        <div>
          <button type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </div>
      </form>
    </main>
  );
}
