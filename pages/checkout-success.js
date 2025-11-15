import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function CheckoutSuccess() {
  const router = useRouter();
  const { session_id: sessionIdQuery } = router.query || {};
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('');
  const [setPwToken, setSetPwToken] = useState(null);

  useEffect(() => {
    async function finalize() {
      const sessionId =
        sessionIdQuery ||
        (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('session_id') : null);

      if (!sessionId) {
        setStatus('error');
        setMessage('Missing session_id in query string.');
        return;
      }

      setStatus('working');
      try {
        const res = await fetch('/api/complete-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        const body = await res.json();
        if (!res.ok) {
          setStatus('error');
          setMessage(body?.error || 'Could not complete checkout.');
          return;
        }

        if (body && body.nh_session) {
          try {
            localStorage.setItem('nh_session', body.nh_session);
          } catch (e) {}
        }

        if (body?.set_password_token) {
          setSetPwToken(body.set_password_token);
          // If we created a token, show the set-password call-to-action and don't auto-redirect immediately.
          setStatus('done');
          return;
        }

        // No token => short redirect to dashboard
        setStatus('done');
        setTimeout(() => {
          window.location.href = '/';
        }, 700);
      } catch (err) {
        console.error('finalize checkout error', err);
        setStatus('error');
        setMessage(err?.message || 'Network error');
      }
    }

    finalize();
  }, [sessionIdQuery]);

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: 24 }}>
      <h1>Finishing checkout…</h1>
      {status === 'pending' && <p>Waiting for Stripe...</p>}
      {status === 'working' && <p>Finalizing your session and signing you in. You will be redirected shortly…</p>}
      {status === 'done' && <p>Success — you are signed in.</p>}
      {status === 'error' && (
        <div style={{ color: '#ef4444' }}>
          <p>Could not complete sign-in after checkout: {message}</p>
          <p>If this persists, please use the Sign In or Forgot password links on the site.</p>
        </div>
      )}

      {setPwToken && (
        <div style={{ marginTop: 16, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
          <div style={{ marginBottom: 8 }}>
            To finish securing your account, set a password so you can sign in directly next time.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={`/set-password?token=${setPwToken}`} style={{ color: '#2563eb' }}>Set your password</a>
            <button onClick={() => { window.location.href = '/'; }} style={{ padding: '6px 10px' }}>Continue to dashboard</button>
          </div>
        </div>
      )}
    </main>
  );
}
