import { useState } from 'react';
import CheckoutSuccess from '../../src/components/CheckoutSuccess';

/**
 * Minimal set-password page (src/pages variant).
 * - When password is submitted, show the new registered message.
 * - Does NOT automatically navigate away; user can click Sign in when ready.
 */
export default function SetPasswordPage() {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) throw new Error('Failed');

      setStatus('success');
    } catch (err) {
      console.error(err);
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
            There was an error saving your password. Please try again.
          </p>
        )}
      </form>
    </main>
  );
}
