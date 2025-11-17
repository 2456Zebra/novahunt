import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

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

      // Optionally auto-signin after signup: call signin endpoint to get session
      try {
        const signin = await fetch('/api/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: String(email || '').trim(), password }),
        });
        const signinBody = await signin.json();
        if (signin.ok) {
          if (signinBody?.nh_session && typeof window !== 'undefined') {
            localStorage.setItem('nh_session', signinBody.nh_session);
          }
        }
      } catch (_) {
        // ignore signin problems here; user can sign in manually
      }

      // Redirect to dashboard
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
