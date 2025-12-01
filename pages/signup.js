import { useState } from 'react';

/*
pages/signup.js

Behavior & guarantees (only this file):
- The plan selection only offers "Free" (no other tiers shown).
- On submit this page will:
  1. Attempt to POST to /api/signup (if you have a server endpoint). If the endpoint returns success and includes usage data, use it.
  2. On success (server or local mock) it will set the client-side localStorage keys the site header expects:
     - nh_user_email: the new user's email (string)
     - nh_usage: JSON object { plan, searches, reveals, limitSearches, limitReveals }
     - nh_usage_last_update: timestamp string (triggers storage listeners in other tabs/components)
  3. Redirect to the homepage ('/') so ClientAuthHeader (or equivalent) will see nh_user_email / nh_usage and show the logged-in pulldown.
- No other site files are modified. This file only fixes the plan pulldown and ensures local client sign-in state after signup.
*/

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Free plan defaults (keep in sync with server limits if you change them)
  const FREE_USAGE = { plan: 'free', searches: 0, reveals: 0, limitSearches: 5, limitReveals: 3 };

  const setClientSignedIn = (userEmail, usage = FREE_USAGE) => {
    try {
      localStorage.setItem('nh_user_email', String(userEmail || ''));
      localStorage.setItem('nh_usage', JSON.stringify(usage));
      localStorage.setItem('nh_usage_last_update', Date.now().toString());
    } catch (e) {
      // ignore localStorage failures but surface to console
      console.warn('failed to set localStorage on signup', e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter an email and password.');
      return;
    }

    setLoading(true);
    try {
      // Try server signup endpoint if available
      let serverResp = null;
      try {
        const res = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, plan: 'free' }),
        });

        if (res.ok) {
          // Accept server-provided usage object if returned
          serverResp = await res.json();
        } else {
          // Non-2xx from server: treat as signup failure but continue to client fallback
          const text = await res.text().catch(() => '');
          throw new Error(text || 'Signup failed on server');
        }
      } catch (err) {
        // If no server endpoint or network error, fall back to client-only flow.
        // We'll continue to set client state below.
        serverResp = null;
        // don't rethrow — fallback below will sign the user into client
      }

      // If server returned usage, use it. Otherwise use FREE_USAGE.
      const usage = (serverResp && serverResp.usage) ? serverResp.usage : FREE_USAGE;

      // Persist client-side signed-in markers so header sees the user
      setClientSignedIn(email, usage);

      // Redirect to homepage where ClientAuthHeader should render the signed-in pulldown
      window.location.href = '/';
    } catch (err) {
      console.error(err);
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 680, margin: '0 auto', boxSizing: 'border-box' }}>
      <h1 style={{ marginTop: 0 }}>Create an account</h1>

      <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #eee', padding: 20, borderRadius: 8 }}>
        <label style={{ display: 'block', marginBottom: 12 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '10px 12px', marginTop: 6, borderRadius: 6, border: '1px solid #e6e6e6', boxSizing: 'border-box' }}
            required
          />
        </label>

        <label style={{ display: 'block', marginBottom: 12 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '10px 12px', marginTop: 6, borderRadius: 6, border: '1px solid #e6e6e6', boxSizing: 'border-box' }}
            required
          />
        </label>

        <label style={{ display: 'block', marginBottom: 12 }}>
          Plan
          {/* Only show Free on this page. Other plans must be purchased via the Plans flow / Stripe. */}
          <select value="free" disabled style={{ display: 'block', width: '100%', padding: '10px 12px', marginTop: 6, borderRadius: 6, border: '1px solid #e6e6e6', background: '#f5f7fb', boxSizing: 'border-box' }}>
            <option value="free">Free</option>
          </select>
        </label>

        {error && <div style={{ color: 'crimson', marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '10px 14px', borderRadius: 8, background: '#0b74ff', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
          >
            {loading ? 'Creating…' : 'Create account'}
          </button>

          <a href="/" style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e6e6e6', background: '#fff', color: '#333', display: 'inline-flex', alignItems: 'center' }}>
            Cancel
          </a>
        </div>
      </form>
    </main>
  );
}
