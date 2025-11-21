'use client';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function StripeSuccess() {
  const router = useRouter();
  const { session_id } = router.query;
  const [status, setStatus] = useState('Finalizing checkout...');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!session_id) {
      // Wait briefly — sometimes router.query isn't populated immediately
      const t = setTimeout(() => {
        if (!router.query.session_id) {
          setStatus('Missing session_id. If this persists, please use the Sign in or Forgot password links on the site.');
        }
      }, 600);
      return () => clearTimeout(t);
    }

    async function finalize() {
      setBusy(true);
      setStatus('Verifying checkout session with Stripe...');
      try {
        const res = await fetch(`/api/stripe-complete?session_id=${encodeURIComponent(session_id)}`);
        const json = await res.json();
        if (!json.ok) {
          setStatus(`Could not complete sign-in after checkout: ${json.error || 'Unknown error'}`);
          setBusy(false);
          return;
        }

        // TODO: Here you would typically create/restore the user's session using the checkout info.
        // If your API returned a session token or set a cookie, you can redirect the user now.
        setStatus('Checkout verified. Redirecting to account...');
        setTimeout(() => {
          router.replace('/account');
        }, 900);
      } catch (err) {
        setStatus(`Could not complete sign-in after checkout: ${err?.message || 'Unknown error'}`);
      } finally {
        setBusy(false);
      }
    }

    finalize();
  }, [session_id, router]);

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '40px auto' }}>
      <h2>Finishing checkout…</h2>
      <div style={{ marginTop: 12 }}>
        <div>{status}</div>
        {busy ? <div style={{ marginTop: 12 }}>One moment please…</div> : null}
        <div style={{ marginTop: 18 }}>
          If this persists, please use the Sign In or Forgot password links on the site.
        </div>
      </div>
    </div>
  );
}
