// pages/set-password.js
// Minimal Set Password page with a single password field.
// Email is read-only (from query) and the page silently calls /api/auth/signin after finalizing password
// so the user is immediately signed in and redirected to /account.
// If an optional server-side set-password endpoint exists at SET_PASSWORD_API, it will be called (code tolerates 404).

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const SET_PASSWORD_API = '/api/auth/set-password'; // if you have an endpoint to finalize password; tolerated if absent
const SIGNIN_API = '/api/auth/signin';

export default function SetPasswordPage() {
  const router = useRouter();
  const { email: queryEmail } = router.query; // pre-filled from success redirect

  const [email, setEmail] = useState(queryEmail || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (queryEmail) setEmail(queryEmail);
  }, [queryEmail]);

  async function finalizeAndSignin() {
    setError('');
    if (!email) {
      setError('Email is required.');
      return;
    }
    if (!password || password.length < 8) {
      setError('Please enter a password of at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      // 1) Optionally finalize password on server (if endpoint exists)
      try {
        const resSet = await fetch(SET_PASSWORD_API, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (resSet.status >= 400 && resSet.status !== 404 && resSet.status !== 405) {
          const txt = await resSet.text().catch(()=>null);
          throw new Error(`Set-password finalize failed (${resSet.status}): ${txt || 'no details'}`);
        }
      } catch (err) {
        if (err.message && err.message.includes('Set-password finalize failed')) throw err;
        // otherwise continue if endpoint missing
      }

      // 2) Sign in server-side to set HttpOnly cookie (server must set Domain=.novahunt.ai and SameSite=None)
      const r = await fetch(SIGNIN_API, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!r.ok) {
        const bodyText = await r.text().catch(()=>null);
        console.warn('/api/auth/signin failed', r.status, bodyText);
        setError('Could not sign you in automatically. Please try again or contact support.');
        setLoading(false);
        return;
      }

      // 3) Redirect to account (server set cookie)
      router.replace('/account');
    } catch (err) {
      console.error('Set password error', err);
      setError(err.message || 'An error occurred.');
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '28px auto', padding: 20 }}>
      <h1>Set your password</h1>
      <p>Enter a password to finish setting up your account and be redirected to your Account page.</p>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6 }}>Email</label>
        <input
          type="email"
          value={email}
          readOnly
          style={{ display: 'block', width: '100%', padding: 8, background: '#f7f7f7', border: '1px solid #e5e5e5' }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6 }}>New password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          placeholder="At least 8 characters"
          style={{ display: 'block', width: '100%', padding: 8 }}
        />
      </div>

      {error && <div style={{ color: 'crimson', marginBottom: 12 }}>{error}</div>}

      <div>
        <button
          onClick={finalizeAndSignin}
          disabled={loading}
          style={{ padding: '10px 18px' }}
        >
          {loading ? 'Finishing...' : 'Finish and go to Account'}
        </button>
      </div>
    </div>
  );
}
