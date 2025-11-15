import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function SetPasswordPage() {
  const router = useRouter();
  const { token: tokenQuery } = router.query || {};
  const [token, setToken] = useState(tokenQuery || '');
  const [emailForToken, setEmailForToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [resendLink, setResendLink] = useState(null);

  useEffect(() => {
    if (tokenQuery) setToken(tokenQuery);
  }, [tokenQuery]);

  async function submit(e) {
    e.preventDefault();
    setMessage('');
    if (!token) return setMessage('Missing token. Use Resend / Generate link to create one.');
    if (password.length < 8) return setMessage('Password must be at least 8 characters.');
    if (password !== confirm) return setMessage('Passwords do not match.');

    setStatus('working');
    try {
      const res = await fetch('/api/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setStatus('error');
        setMessage((body && body.error) || 'Could not set password');
        return;
      }

      if (body && body.nh_session) {
        try { localStorage.setItem('nh_session', body.nh_session); } catch (e) {}
      }

      setStatus('done');
      setMessage('Password set. Redirecting to dashboard…');
      setTimeout(() => (window.location.href = '/'), 900);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage(err?.message || 'Network error');
    }
  }

  async function resendToken() {
    setMessage('');
    setResendLink(null);

    // If token already present, ask server to regenerate for same email
    if (token) {
      // We don't have token->email on client, so prompt for email fallback
      const email = prompt('Enter your email to generate a new set-password token:');
      if (!email) return;
      setEmailForToken(email);
    }

    // If no token, require user to provide an email
    if (!token && !emailForToken) {
      const e = prompt('Enter the email for which you want a set-password link:');
      if (!e) return;
      setEmailForToken(e);
    }

    if (!emailForToken) {
      setMessage('Email required to generate a set-password link.');
      return;
    }

    setStatus('working');
    try {
      const res = await fetch('/api/generate-setpw-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailForToken }),
      });
      const body = await res.json();
      if (!res.ok) {
        setStatus('error');
        setMessage(body?.error || 'Could not generate token');
        return;
      }
      setStatus('idle');
      setResendLink(body?.url || null);
      setMessage('A temporary set-password link was created. Use the link below or check your email (if emailing is enabled).');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage(err?.message || 'Network error');
    }
  }

  return (
    <main style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <h1>Set your password</h1>
      <p>Enter a password to secure your account.</p>

      <form onSubmit={submit} style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
        <input type="hidden" value={token} />
        {!token && (
          <label>
            Email for set-password link
            <input type="email" value={emailForToken} onChange={(e) => setEmailForToken(e.target.value)} placeholder="you@example.com" style={{ width: '100%', padding: 8 }} />
          </label>
        )}

        <label>
          New password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} style={{ width: '100%', padding: 8 }} />
        </label>
        <label>
          Confirm password
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} style={{ width: '100%', padding: 8 }} />
        </label>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={status === 'working'} style={{ padding: '8px 12px' }}>
            {status === 'working' ? 'Setting…' : 'Set password'}
          </button>
          <button type="button" onClick={resendToken} disabled={status === 'working'} style={{ padding: '8px 12px' }}>
            Resend / Generate link
          </button>
        </div>

        {message && <div style={{ color: status === 'error' ? '#ef4444' : '#111827' }}>{message}</div>}
        {resendLink && (
          <div style={{ marginTop: 12 }}>
            <div>Temporary link:</div>
            <a href={resendLink} style={{ color: '#2563eb' }}>{resendLink}</a>
          </div>
        )}
      </form>

      <div style={{ marginTop: 18, color: '#6b7280' }}>
        If the token has expired, use "Resend / Generate link" above to create a new one.
      </div>
    </main>
  );
}
