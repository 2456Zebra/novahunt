// pages/success.js
// Client success page that calls the get-checkout-session API and shows clear messages.

import { useEffect, useState } from 'react';

export default function SuccessPage() {
  const [fetching, setFetching] = useState(true);
  const [email, setEmail] = useState('');
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const session_id = params.get('session_id');
    if (!session_id) {
      setError('Missing session_id');
      setFetching(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/get-checkout-session?session_id=${encodeURIComponent(session_id)}`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(json?.message || json?.error || `Server returned ${res.status}`);
        } else {
          setEmail(json.email || '');
          setPaid(Boolean(json.paid));
        }
      } catch (e) {
        setError('Network error while fetching session');
      } finally {
        setFetching(false);
      }
    })();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const params = new URLSearchParams(window.location.search);
    const session_id = params.get('session_id');
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
        setError(json?.message || json?.error || 'Signup failed');
        setLoading(false);
        return;
      }
      window.location.href = '/app';
    } catch (err) {
      setError('Server error during signup');
    } finally {
      setLoading(false);
    }
  }

  if (fetching) return <div style={{ padding: 24 }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 680, margin: '48px auto', padding: 20 }}>
      <h1>Complete account setup</h1>
      {error ? (
        <div style={{ color: 'red' }}>
          <p>{error}</p>
          <p>Contact support if you need help.</p>
        </div>
      ) : (
        <>
          <p>You purchased with: <strong>{email || 'Email not provided by Stripe'}</strong></p>
          {!paid && <div style={{ color: '#b36' }}>Note: Payment not yet confirmed.</div>}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
            <label>
              Password (min 8 chars)
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: 8, marginTop: 6 }} />
            </label>
            <div>
              <button type="submit" disabled={loading} style={{ padding: '10px 16px' }}>
                {loading ? 'Creating account…' : 'Set password & finish signup'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
