// pages/success.js
// Client success page: reads ?session_id=... from URL, asks server for the checkout email,
// shows 1-2 quick flashes and then redirects to /set-password?email=... (so set-password can auto-signin).
// If email cannot be obtained, shows a "Sign in" link and a link to go to /set-password manually.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function SuccessPage() {
  const router = useRouter();
  const { session_id } = router.query;
  const [status, setStatus] = useState('loading'); // loading -> ready -> redirect-failed
  const [email, setEmail] = useState(null);

  useEffect(() => {
    if (!session_id) return;
    let cancelled = false;

    async function fetchEmailAndRedirect() {
      try {
        setStatus('loading');
        const res = await fetch(`/api/stripe-session?session_id=${encodeURIComponent(session_id)}`, {
          method: 'GET',
          credentials: 'same-origin'
        });

        if (!res.ok) {
          // fallback: show UI and let user click through
          setStatus('redirect-failed');
          return;
        }

        const body = await res.json();
        if (cancelled) return;
        setEmail(body.email || null);

        // show first flash quickly, then second, then redirect
        setStatus('ready');

        // Pause briefly so users see the two quick page flashes you mentioned
        // First flash: "Payment processed" (we're already on success page)
        // Second flash: "Redirecting to set password..."
        await new Promise(r => setTimeout(r, 800)); // short pause
        // Then redirect to set-password with email prefilled
        const target = `/set-password?email=${encodeURIComponent(body.email || '')}`;
        // Use replace so history doesn't keep success page
        router.replace(target);
      } catch (err) {
        console.error('success page error', err);
        setStatus('redirect-failed');
      }
    }

    fetchEmailAndRedirect();
    return () => { cancelled = true; };
  }, [session_id, router]);

  return (
    <div style={{ maxWidth: 780, margin: '28px auto', padding: 20 }}>
      <h1>Payment processed</h1>

      {status === 'loading' && (
        <>
          <p>Finalizing your account...</p>
          <p>Please wait — you will be redirected to finish setting your password.</p>
        </>
      )}

      {status === 'ready' && (
        <>
          <p>Payment processed</p>
          <p>Redirecting you to set your password and finish account setup...</p>
        </>
      )}

      {status === 'redirect-failed' && (
        <>
          <p>Payment processed</p>
          <p>Unable to automatically continue. You can:</p>
          <ul>
            <li><a href="/set-password">Set your password (manual)</a></li>
            <li><a href="/signin">Sign in</a> (if you already set a password)</li>
          </ul>
          <p>If you continue to have trouble, contact support.</p>
        </>
      )}

      <footer style={{ marginTop: 40, fontSize: 12, color: '#666' }}>
        © {new Date().getFullYear()} NovaHunt.ai
      </footer>
    </div>
  );
}
