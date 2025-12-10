import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';

// Client-side Supabase keys (set these in Vercel as NEXT_PUBLIC_*)
// NEXT_PUBLIC_SUPABASE_URL
// NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function SuccessPage() {
  const router = useRouter();
  const { session_id } = router.query;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [email, setEmail] = useState('');
  const [paid, setPaid] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!session_id) return;
    setFetching(true);
    fetch(`/api/get-checkout-session?session_id=${encodeURIComponent(session_id)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json?.error) {
          setError(json.message || json.error || 'Could not fetch session');
        } else {
          setEmail(json.email || '');
          setPaid(Boolean(json.paid));
        }
      })
      .catch((err) => {
        console.error('get-checkout-session error', err);
        setError('Failed to fetch checkout session');
      })
      .finally(() => setFetching(false));
  }, [session_id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!session_id) return setError('Missing session_id');
    if (!password || password.length < 8) return setError('Password must be at least 8 characters');

    setLoading(true);
    try {
      const res = await fetch('/api/complete-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.message || json?.error || 'Signup failed');
        setLoading(false);
        return;
      }

      // Optionally auto sign-in the user via Supabase client (requires NEXT_PUBLIC_SUPABASE_ANON_KEY)
      try {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: json.email || email,
          password,
        });
        if (signInError) {
          // Not fatal: account was created, but sign-in failed (user can sign in manually)
          console.warn('Auto sign-in failed', signInError);
          setDone(true);
        } else {
          // Signed in successfully
          // Redirect to app landing (adjust path as needed)
          router.replace('/app');
          return;
        }
      } catch (err) {
        console.error('supabase sign in error', err);
        setDone(true);
      }

      setDone(true);
    } catch (err) {
      console.error('complete-signup request failed', err);
      setError('Server error during signup');
    } finally {
      setLoading(false);
    }
  }

  if (!session_id) {
    return (
      <div style={{ maxWidth: 680, margin: '48px auto', padding: 20 }}>
        <h2>Missing session</h2>
        <p>No checkout session_id found in the URL. Please return to the plans page and try again.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: '48px auto', padding: 20 }}>
      <h1>Complete account setup</h1>

      {fetching ? (
        <p>Loading checkout details…</p>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <>
          <p>
            You purchased with: <strong>{email || 'Email not provided by Stripe'}</strong>
          </p>

          {!paid && (
            <div style={{ marginBottom: 12, color: '#b36' }}>
              Note: Payment not yet confirmed. You may not be able to complete signup until payment is confirmed.
            </div>
          )}

          {done ? (
            <div>
              <h3>Account created</h3>
              <p>
                Your account was created. If you were not signed in automatically, please <a href="/sign-in">sign in</a>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled
                  style={{ width: '100%', padding: 8, marginTop: 6 }}
                />
              </label>

              <label>
                Password (min 8 chars)
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: 8, marginTop: 6 }}
                />
              </label>

              <div>
                <button type="submit" disabled={loading} style={{ padding: '10px 16px' }}>
                  {loading ? 'Creating account…' : 'Set password & finish signup'}
                </button>
              </div>

              {error && <div style={{ color: 'red' }}>{error}</div>}
            </form>
          )}
        </>
      )}
    </div>
  );
}
