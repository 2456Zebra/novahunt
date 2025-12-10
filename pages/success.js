import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';

// Optional auto sign-in (requires NEXT_PUBLIC_SUPABASE_ANON_KEY)
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
  const [attempt, setAttempt] = useState(0);

  // Poll /api/get-checkout-session a few times if it initially fails (Stripe redirect/back-end latency).
  useEffect(() => {
    if (!session_id) return;
    let cancelled = false;

    async function fetchSession(attemptNum = 0) {
      setFetching(true);
      setError('');
      try {
        const res = await fetch(`/api/get-checkout-session?session_id=${encodeURIComponent(session_id)}`);
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          // If session not yet available, we retry (Stripe may not have finished)
          throw new Error(json?.message || json?.error || `HTTP ${res.status}`);
        }
        const json = await res.json();
        if (json?.error) throw new Error(json.error || json.message);
        if (!cancelled) {
          setEmail(json.email || '');
          setPaid(Boolean(json.paid));
          setFetching(false);
        }
      } catch (err) {
        console.warn('get-checkout-session attempt failed', attemptNum, err);
        if (cancelled) return;
        if (attemptNum < 4) {
          // Exponential backoff: wait 1s, 2s, 4s, 8s...
          const wait = Math.pow(2, attemptNum) * 1000;
          setTimeout(() => fetchSession(attemptNum + 1), wait);
          setAttempt(attemptNum + 1);
        } else {
          setError('Failed to fetch checkout session. If you completed payment, wait a moment and try again or contact support.');
          setFetching(false);
        }
      }
    }

    fetchSession(0);
    return () => { cancelled = true; };
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

      // Optionally auto sign-in via Supabase client if anon key is set
      try {
        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email: json.email || email,
            password,
          });
          if (signInError) {
            console.warn('Auto sign-in failed', signInError);
            setDone(true);
          } else {
            router.replace('/app');
            return;
          }
        } else {
          setDone(true);
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
        <p>Loading checkout details… (this may take a few seconds)</p>
      ) : error ? (
        <div style={{ color: 'red' }}>
          <p>{error}</p>
          <p style={{ marginTop: 12 }}>
            Helpful actions:
            <ul>
              <li>Open the link you were redirected from and copy the session_id (if present) and paste it here.</li>
              <li>Run a direct Stripe API check (see instructions below) to confirm the session exists.</li>
              <li>Contact support with the session_id in the URL.</li>
            </ul>
          </p>
        </div>
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
