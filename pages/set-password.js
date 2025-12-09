// pages/set-password.js
// Minimal Set Password page that:
// - reads email (from query or user input) and password fields
// - calls your existing set-password endpoint (if you have one) OR skips that step
// - then POSTs to /api/auth/signin to have the server set the HttpOnly cookie
// - redirects to /account on success
//
// NOTES for you before deploying:
// - If your backend already exposes a set-password endpoint, set SET_PASSWORD_API to that path.
// - Ensure pages/api/auth/signin.js (server) is deployed and COOKIE_DOMAIN is set to ".novahunt.ai" in Vercel.
// - Adjust styles and any UX to match your app.

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const SET_PASSWORD_API = '/api/auth/set-password'; // change if your endpoint is different
const SIGNIN_API = '/api/auth/signin';

export default function SetPasswordPage() {
  const router = useRouter();
  const { email: queryEmail } = router.query;

  const [email, setEmail] = useState(queryEmail || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (queryEmail) setEmail(queryEmail);
  }, [queryEmail]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email.');
      return;
    }
    if (!password || password.length < 8) {
      setError('Please enter a password of at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // 1) Finalize password on your backend if you have a dedicated endpoint.
      // If you don't, skip this block and go straight to signin.
      try {
        const resSet = await fetch(SET_PASSWORD_API, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        // If your set-password endpoint returns 404 or 405, we treat it as "no-server-step" and continue.
        if (resSet.status >= 400 && resSet.status !== 404 && resSet.status !== 405) {
          const txt = await resSet.text().catch(()=>null);
          throw new Error(`Set-password failed (${resSet.status}): ${txt || 'no details'}`);
        }
      } catch (err) {
        // If the set-password API doesn't exist, ignore and continue to signin.
        // But if it exists and failed, surface the error.
        if (err.message && err.message.includes('Set-password failed')) throw err;
        // otherwise continue
      }

      // 2) Sign in server-side so server can set HttpOnly cookie (session, sb:token)
      const r = await fetch(SIGNIN_API, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!r.ok) {
        const b = await r.json().catch(()=>({}));
        // Friendly fallback: offer Sign in button / show message
        setError('Could not sign you in automatically. Please use the Sign in link.');
        console.warn('/api/auth/signin error', r.status, b);
        setLoading(false);
        return;
      }

      // 3) On success, redirect to account (server set cookie)
      router.replace('/account');
    } catch (err) {
      console.error('Set password flow error', err);
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '28px auto', padding: 20 }}>
      <h1>Set your password</h1>
      <p>Enter a password to finish setting up your account and be redirected to your Account page.</p>

      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 6 }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: 8 }}>
          New password
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 6 }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: 12 }}>
          Confirm password
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 6 }}
          />
        </label>

        {error && <div style={{ color: 'crimson', marginBottom: 12 }}>{error}</div>}

        <button type="submit" disabled={loading} style={{ padding: '10px 18px' }}>
          {loading ? 'Finishing...' : 'Finish and go to Account'}
        </button>
      </form>

      <div style={{ marginTop: 18 }}>
        <a href="/signin">Sign in</a> — if auto sign-in fails, you can sign in manually.
      </div>
    </div>
  );
}
