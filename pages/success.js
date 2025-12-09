// pages/success.js
// Displays two quick flashes, shows a small grey token (truncated session_id) and then redirects to /set-password?email=...
// Expects ?session_id=... in the URL. Uses /api/stripe-session to retrieve the customer's email server-side.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function SuccessPage() {
  const router = useRouter();
  const { session_id } = router.query;
  const [status, setStatus] = useState('loading'); // loading -> ready -> failed
  const [email, setEmail] = useState('');
  const [tokenToShow, setTokenToShow] = useState('');

  useEffect(() => {
    if (!session_id) return;
    let cancelled = false;

    async function run() {
      setStatus('loading');
      try {
        // Fetch customer email from server so we can redirect to /set-password?email=...
        const res = await fetch(`/api/stripe-session?session_id=${encodeURIComponent(session_id)}`, {
          method: 'GET',
          credentials: 'same-origin'
        });

        if (!res.ok) {
          setStatus('failed');
          return;
        }
        const body = await res.json();
        if (cancelled) return;
        setEmail(body.email || '');

        // Show a small grey token derived from the session id (truncated for display)
        const tidy = String(session_id).slice(0, 18);
        setTokenToShow(tidy);

        // first flash
        setStatus('ready');
        // short pause so user sees the two quick flashes
        await new Promise(r => setTimeout(r, 700));
        // second flash (keep status ready, we just pause)
        await new Promise(r => setTimeout(r, 600));

        // Redirect to the simple set-password page with email in query
        const target = `/set-password?email=${encodeURIComponent(body.email || '')}&token=${encodeURIComponent(session_id)}`;
        router.replace(target);
      } catch (err) {
        console.error('success page error', err);
        if (!cancelled) setStatus('failed');
      }
    }

    run();
    return () => { cancelled = true; };
  }, [session_id, router]);

  return (
    <div style={{ maxWidth: 780, margin: '28px auto', padding: 20 }}>
      <h1>Payment processed</h1>

      {status === 'loading' && (
        <p>Finalizing your account...</p>
      )}

      {status === 'ready' && (
        <>
          <p>Payment processed</p>
          <p style={{ color: '#666', marginTop: 8 }}>
            <small style={{ color: '#999' }}>{tokenToShow ? `Token: ${tokenToShow}` : ''}</small>
          </p>
          <p style={{ marginTop: 12 }}>Redirecting to set your password...</p>
        </>
      )}

      {status === 'failed' && (
        <>
          <p>Payment processed</p>
          <p>We couldn't continue automatically. Please <a href="/set-password">set your password</a> or contact support.</p>
        </>
      )}

      <footer style={{ marginTop: 40, fontSize: 12, color: '#666' }}>
        © {new Date().getFullYear()} NovaHunt.ai
      </footer>
    </div>
  );
}
