import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SetPasswordPage() {
  const router = useRouter();
  const { email: qEmail, token: qToken } = router.query || {};
  const [email, setEmail] = useState(qEmail || '');
  const [token, setToken] = useState(qToken || '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (qEmail) setEmail(qEmail);
    if (qToken) setToken(qToken);
  }, [qEmail, qToken]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, token })
      });
      const text = await res.text().catch(()=>null);
      let body;
      try { body = text ? JSON.parse(text) : null; } catch (e) { body = text; }

      setMessage(`Response ${res.status}: ${JSON.stringify(body)}`);

      // If server set a session cookie, subsequent /api/me should return authenticated:true.
      // Server currently attempts to set cookies after create/update; if so redirect to account.
      if (body && body.ok && (body.action === 'created' || body.action === 'updated' || body.action === 'updated_after_create_conflict')) {
        // Give the browser a short moment to accept cookies then check /api/me
        await new Promise(r => setTimeout(r, 400));
        try {
          const me = await fetch('/api/me', { credentials: 'same-origin' });
          const meText = await me.text().catch(()=>null);
          let meBody;
          try { meBody = meText ? JSON.parse(meText) : null; } catch(e) { meBody = meText; }
          if (me.ok && meBody && meBody.authenticated) {
            // Signed-in — redirect to account/home
            router.replace('/account');
            return;
          } else {
            setMessage(prev => prev + ' — session not detected by /api/me.');
          }
        } catch (e) {
          setMessage(prev => prev + ' — error checking session.');
        }
      }

      // If server returned password_reset_disabled or rate-limited, show friendly message
      if (body && body.action === 'password_reset_disabled') {
        setError('Password recovery is temporarily disabled by the site owner. Contact support.');
      } else if (body && body.action === 'password_reset_rate_limited') {
        setError(`Recovery recently requested. Try again in ${body.retry_after || 40} seconds.`);
      } else if (body && body.action === 'password_reset_sent') {
        setMessage('A password recovery email was sent. Check your inbox.');
      }

    } catch (err) {
      console.error(err);
      setError('Unexpected error calling server.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 700, margin: '2rem auto', fontFamily: 'system-ui, sans-serif', padding: '0 1rem' }}>
      <h1>Set your password</h1>
      <p>If you were redirected here after checkout, enter the password you'd like to use for this account.</p>

      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Email
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" required style={{ width: '100%', padding: 8, marginTop: 4 }} />
        </label>

        <label style={{ display: 'block', marginBottom: 8 }}>
          Password
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" required style={{ width: '100%', padding: 8, marginTop: 4 }} />
        </label>

        <button type="submit" disabled={busy} style={{ padding: '10px 16px', cursor: busy ? 'default' : 'pointer' }}>
          {busy ? 'Working…' : 'Set password'}
        </button>
      </form>

      {message && <div style={{ marginTop: 16, padding: 12, background: '#eef', borderRadius: 6 }}>{String(message)}</div>}
      {error && <div style={{ marginTop: 16, padding: 12, background: '#fee', borderRadius: 6, color: '#900' }}>{String(error)}</div>}

      <p style={{ marginTop: 24, color: '#666' }}>
        If automatic sign-in fails, please sign in manually from the Sign in page.
      </p>
    </main>
  );
}
