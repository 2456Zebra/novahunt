import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Ensure we don't prefill fields from query or history
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
      const res = await fetch('/api/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: String(email || '').trim(), password }),
      });
      const body = await res.json();
      if (!res.ok) {
        // show helpful error to user; keep fields for correction
        setError(body?.error || 'Signin failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      // success: server returned nh_session token (and set cookie)
      // store minimal client state and redirect to dashboard/home.
      try {
        if (body?.nh_session) {
          // also store in localStorage for immediate client-side use if desired
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('nh_session', body.nh_session);
          }
        }
      } catch (err) {
        // ignore localStorage errors
      }

      // Redirect to the main dashboard/home
      router.replace('/');
    } catch (err) {
      setError('Network or server error. Try again.');
      setLoading(false);
    }
  }

  function goToCreateAccount() {
    // Navigate to create account WITHOUT passing current form values
    router.push('/signup');
  }

  return (
    <main className="container">
      <h1>Sign In</h1>
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
            autoComplete="current-password"
          />
        </label>

        {error && <div className="error" role="alert">{error}</div>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <button type="button" onClick={goToCreateAccount}>
            Create account
          </button>
        </div>
      </form>
    </main>
  );
}
