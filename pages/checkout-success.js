import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function CheckoutSuccess() {
  const router = useRouter();
  const { session_id: sessionIdQuery } = router.query || {};
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Always attempt to finalize on mount — read session_id from query string if not present via router
    async function finalize() {
      // Prefer router-provided query, fallback to window.location.search
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

        // Save to localStorage as your app expects
        if (body && body.nh_session) {
          try {
            localStorage.setItem('nh_session', body.nh_session);
          } catch (e) {
            // ignore localStorage errors
          }
        }

        // If a set_password_token was returned, optionally show a message (kept simple for now)
        if (body?.set_password_token) {
          // You could show a link or auto-email — for now we log to console for convenience in testing
          console.info('set_password_token:', body.set_password_token);
        }

        setStatus('done');
        // short delay so user sees success message before redirect
        setTimeout(() => {
          window.location.href = '/';
        }, 700);
      } catch (err) {
        console.error('finalize checkout error', err);
        setStatus('error');
        setMessage(err?.message || 'Network error');
      }
    }

    // Call finalize immediately on mount (and also on updates if router query becomes available)
    finalize();
  // We intentionally only run once on mount — finalize reads router/query and window.location directly.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: 24 }}>
      <h1>Finishing checkout…</h1>
      {status === 'pending' && <p>Waiting for Stripe...</p>}
      {status === 'working' && <p>Finalizing your session and signing you in. You will be redirected shortly…</p>}
      {status === 'done' && <p>Success — you are signed in and will be redirected to your Dashboard.</p>}
      {status === 'error' && (
        <div style={{ color: '#ef4444' }}>
          <p>Could not complete sign-in after checkout: {message}</p>
          <p>If this persists, please use the Sign In or Forgot password links on the site.</p>
        </div>
      )}
    </main>
  );
}
