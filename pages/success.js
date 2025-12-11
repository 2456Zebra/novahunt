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

  // Poll /api/get-checkout-session with retries (exponential backoff)
  useEffect(() => {
    if (!session_id) return;
    let cancelled = false;

    async function fetchSession(attemptNum = 0) {
      setFetching(true);
      setError('');
      try {
        const res = await fetch(`/api/get-checkout-session?session_id=${encodeURIComponent(session_id)}`);
        if (!res.ok) {
          // If not ok, throw so we can retry
          const json = await res.json().catch(() => ({}));
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
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Surface the server error message if present
        setError(json?.message || json?.error || 'Signup failed');
        setLoading(false);
        return;
      }

      // If we can auto-sign-in via Supabase client, try that; otherwise do a full-page redirect.
      try {
        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email: json.email || email,
            password,
          });
          if (signInError) {
            // Auto sign-in failed -> fall back to full-page redirect to /app
            console.warn('Auto sign-in failed', signInError);
            // Use full page load to avoid Next.js _next/data mismatch issues
            window.location.href = '/app';
            return;
          } else {
            // On success, perform a full navigation to the app to ensure fresh server state
            window.location.href = '/app';
            return;
          }
        } else {
          // No client anon key configured — do a full page navigation to /app
          window.location.href = '/app';
          return;
        }
      } catch (err) {
        console.error('Auto sign-in error', err);
        // Ensure a full-page navigation even if sign-in step throws
        window.location.href = '/app';
        return;
      }
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
              <li>Copy the session_id from the URL and paste it when contacting support.</li>
              <li>Try again in a few moments — webhooks may take a moment to arrive.</li>
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
