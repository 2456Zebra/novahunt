import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

/*
  Tolerant checkout landing page for Stripe:
  - Reads session_id from query string (preferred)
  - Falls back to localStorage 'stripe_session_id' if present (optional client-side storage)
  - Calls /api/complete-checkout to validate and obtain account details
  - Persists demo account to localStorage and marks user signed in
  - Shows clear instructions when session_id is missing or validation fails
*/

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const querySession = (router && router.query && router.query.session_id) ? router.query.session_id : null;
  const [status, setStatus] = useState('loading'); // loading | success | missing | error
  const [message, setMessage] = useState('');
  const [account, setAccount] = useState(null);

  useEffect(() => {
    async function finishFlow(sessionId) {
      if (!sessionId) {
        setStatus('missing');
        setMessage('Missing session_id in the URL. If this persists, use Sign In or Forgot password links on the site.');
        return;
      }

      try {
        const res = await fetch(`/api/complete-checkout?session_id=${encodeURIComponent(sessionId)}`);
        if (!res.ok) {
          const txt = await res.text();
          setStatus('error');
          setMessage(txt || res.statusText || 'Failed to validate payment session.');
          return;
        }
        const json = await res.json();
        if (json.warning) setMessage(json.warning);

        if (json.account) {
          // persist demo account to localStorage and mark signed in
          try {
            localStorage.setItem('nh_account', JSON.stringify(json.account));
            localStorage.setItem('nh_isSignedIn', '1');
            setAccount(json.account);
            setStatus('success');
            // redirect home after short pause
            setTimeout(() => window.location.href = '/', 1200);
            return;
          } catch (e) {
            setStatus('error');
            setMessage('Could not persist account locally. Please sign in manually.');
            return;
          }
        } else {
          setStatus('error');
          setMessage('Server did not return account details.');
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Unexpected error');
      }
    }

    // Prefer session_id from query param; fallback to localStorage (if checkout creation stored it there)
    const clientStored = (typeof window !== 'undefined') ? localStorage.getItem('stripe_session_id') : null;
    const sid = querySession || clientStored || null;

    // If router isn't ready yet, wait briefly (router.query sometimes empty on first render)
    if (!querySession && typeof window !== 'undefined' && window.location.search && !clientStored) {
      const params = new URLSearchParams(window.location.search);
      const s = params.get('session_id');
      if (s) {
        finishFlow(s);
        return;
      }
    }

    finishFlow(sid);
  }, [querySession]);

  return (
    <div style={{ minHeight: '60vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, system-ui, -apple-system, "Segoe UI", Roboto' }}>
      <div style={{ maxWidth:760, width:'100%', padding:24, background:'#fff', borderRadius:8, border:'1px solid #e6edf3' }}>
        {status === 'loading' && (
          <>
            <h2 style={{ marginTop:0 }}>Finishing checkout…</h2>
            <p style={{ color:'#6b7280' }}>We are verifying your payment. This usually takes a few seconds.</p>
          </>
        )}

        {status === 'success' && account && (
          <>
            <h2 style={{ marginTop:0 }}>Payment complete</h2>
            <p style={{ color:'#374151' }}>Thanks — we've activated your plan for <strong>{account.email}</strong>. Redirecting you back to the site…</p>
            <p style={{ color:'#6b7280', marginTop:12 }}>If you are not redirected automatically, <Link href="/"><a style={{ color:'#2563eb' }}>return to the homepage</a></Link>.</p>
          </>
        )}

        {status === 'missing' && (
          <>
            <h2 style={{ marginTop:0 }}>Could not complete sign-in after checkout</h2>
            <p style={{ color:'#374151' }}>{message}</p>

            <div style={{ marginTop:12 }}>
              <p style={{ color:'#374151' }}>Quick checks:</p>
              <ul style={{ color:'#374151' }}>
                <li>Ensure your SUCCESS_URL includes the placeholder <code>{'{CHECKOUT_SESSION_ID}'}</code>.</li>
                <li>Preferred SUCCESS_URL value (set in Vercel env): <code>https://www.novahunt.ai/checkout-success?session_id={'{CHECKOUT_SESSION_ID}'}</code></li>
                <li>Or store the session id client-side (under localStorage key <code>stripe_session_id</code>) before redirecting to Stripe.</li>
              </ul>
            </div>

            <div style={{ marginTop:12, display:'flex', gap:12 }}>
              <Link href="/signin"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Sign In</a></Link>
              <Link href="/forgot"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Forgot password</a></Link>
              <Link href="/plans"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Plans</a></Link>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <h2 style={{ marginTop:0 }}>Could not complete sign-in after checkout</h2>
            <p style={{ color:'#374151' }}>{message || 'An unexpected error occurred while validating your payment.'}</p>

            <div style={{ marginTop:12, display:'flex', gap:12 }}>
              <Link href="/signin"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Sign In</a></Link>
              <Link href="/forgot"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Forgot password</a></Link>
              <Link href="/plans"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Plans</a></Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
