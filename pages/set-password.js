import { useState } from 'react';
import { useRouter } from 'next/router';
import CheckoutSuccess from '../components/CheckoutSuccess';

/**
 * Client-side set-password page.
 * - Posts password + session_id (from query) to /api/set-password
 * - Displays success or error messages returned by the API
 *
 * Paste this full file into pages/set-password.js replacing your existing file.
 */
export default function SetPasswordPage() {
  const router = useRouter();
  const { session_id, token } = router.query; // token optional if you use one-time tokens

  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const payload = { password };
      if (session_id) payload.session_id = session_id;
      if (token) payload.token = token;

      const res = await fetch('/api/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || `HTTP ${res.status}`);
      }

      setStatus('success');
    } catch (err) {
      console.error('set-password error', err);
      setErrorMsg(err.message || 'Failed');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return <CheckoutSuccess message="Thanks — your password has been registered." />;
  }

  return (
    <main style={{ maxWidth: 640, margin: '48px auto', padding: '0 16px' }}>
      <h1>Set a password</h1>

      <form onSubmit={handleSubmit}>
        <label htmlFor="password">Password</label>
        <div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={{ width: '100%', padding: '8px', marginTop: 8 }}
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Saving…' : 'Set password'}
          </button>
        </div>

        {status === 'error' && (
          <p role="alert" style={{ color: 'red', marginTop: 12 }}>
            {errorMsg || 'There was an error saving your password. Please try again.'}
          </p>
        )}
      </form>

      <p style={{ marginTop: 16, color: '#666', fontSize: 13 }}>
        {/* Show session id for debugging; remove in production */}
        {session_id ? <>session_id: <code>{session_id}</code></> : null}
      </p>
    </main>
  );
}
