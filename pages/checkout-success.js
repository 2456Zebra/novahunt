import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

/*
  Tolerant checkout landing page for Stripe:
  - Reads session_id from query string (preferred)
  - Falls back to localStorage 'stripe_session_id' if present
  - Allows manual paste of session_id for debugging / force-complete
  - Calls /api/complete-checkout to validate and obtain account details
  - Persists demo account to localStorage and marks user signed in
*/

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const qsSession = (router && router.query && router.query.session_id) ? router.query.session_id : null;
  const [status, setStatus] = useState('loading'); // loading | success | missing | error | idle
  const [message, setMessage] = useState('');
  const [account, setAccount] = useState(null);
  const [manual, setManual] = useState('');
  const [working, setWorking] = useState(false);

  useEffect(() => {
    // try to finish using session id from query or localStorage automatically
    async function attemptAuto() {
      const clientStored = (typeof window !== 'undefined') ? localStorage.getItem('stripe_session_id') : null;
      const sid = qsSession || clientStored || null;

      if (!sid) {
        setStatus('missing');
        setMessage('No session_id found in the URL or in localStorage.');
        return;
      }
      await finishFlow(sid);
    }

    // If router query hasn't hydrated yet, also check location.search directly
    if (!qsSession && typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const s = params.get('session_id');
      if (s) {
        finishFlow(s);
        return;
      }
    }

    attemptAuto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qsSession]);

  async function finishFlow(sessionId) {
    setWorking(true);
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch(`/api/complete-checkout?session_id=${encodeURIComponent(sessionId)}`, { method: 'GET' });
      if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        setStatus('error');
        setMessage(`Failed to complete checkout: ${txt || res.statusText}`);
        setWorking(false);
        return;
      }
      const json = await res.json();
      if (json.warning) setMessage(json.warning || '');
      if (json.account) {
        try {
          localStorage.setItem('nh_account', JSON.stringify(json.account));
          localStorage.setItem('nh_isSignedIn', '1');
          // store session id so retries can use it if redirect loses it
          try { localStorage.setItem('stripe_session_id', sessionId); } catch(e){}
          setAccount(json.account);
          setStatus('success');
          setWorking(false);
          // short redirect so user sees confirmation
          setTimeout(() => window.location.href = '/', 800);
          return;
        } catch (e) {
          setStatus('error');
          setMessage('Could not persist account locally. Please sign in manually.');
          setWorking(false);
          return;
        }
      } else {
        setStatus('error');
        setMessage('Server did not return account details.');
        setWorking(false);
        return;
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Unexpected error');
      setWorking(false);
    }
  }

  return (
    <div style={{ minHeight: '60vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, system-ui, -apple-system, \"Segoe UI\", Roboto' }}>
      <div style={{ maxWidth:760, width:'100%', padding:24, background:'#fff', borderRadius:8, border:'1px solid #e6edf3' }}>
        {status === 'loading' && (
          <>
            <h2 style={{ marginTop:0 }}>Finishing checkout…</h2>
            <p style={{ color:'#6b7280' }}>We are verifying your payment. This usually takes a few seconds.</p>
            <div style={{ color:'#6b7280', marginTop:8 }}>{message}</div>
          </>
        )}

        {status === 'success' && account && (
          <>
            <h2 style={{ marginTop:0 }}>Payment complete</h2>
            <p style={{ color:'#374151' }}>Thanks — we've activated your plan for <strong>{account.email}</strong>. Redirecting you back to the site…</p>
            <p style={{ color:'#6b7280', marginTop:12 }}>If you are not redirected automatically, <Link href="/"><a style={{ color:'#2563eb' }}>return to the homepage</a></Link>.</p>
          </>
        )}

        {(status === 'missing' || status === 'error' || status === 'idle') && (
          <>
            <h2 style={{ marginTop:0 }}>{status === 'missing' ? 'Could not complete sign-in after checkout' : 'Checkout completion'}</h2>
            <p style={{ color:'#374151' }}>{message || 'If you recently paid and were not signed in, you can paste your Stripe Checkout Session id below to finish the flow.'}</p>

            <div style={{ marginTop:12 }}>
              <label style={{ display:'block', marginBottom:6, fontSize:13 }}>Checkout session id (from Stripe)</label>
              <input value={manual} onChange={e => setManual(e.target.value)} placeholder="cs_XXXXXXXXXXXX" style={{ width:'100%', padding:'10px 12px', borderRadius:6, border:'1px solid #e6edf3', marginBottom:8 }} />
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => finishFlow(manual)} disabled={!manual || working} style={{ background:'#2563eb', color:'#fff', border:'none', padding:'10px 12px', borderRadius:6, cursor:'pointer' }}>
                  {working ? 'Working…' : 'Complete now'}
                </button>
                <button onClick={() => { localStorage.removeItem('stripe_session_id'); setManual(''); setMessage('Cleared stored session id'); setStatus('missing'); }} style={{ background:'#f3f4f6', border:'1px solid #e6edf3', padding:'10px 12px', borderRadius:6, cursor:'pointer' }}>Clear stored session</button>
              </div>

              <div style={{ marginTop:12, color:'#6b7280' }}>
                Other quick checks:
                <ul>
                  <li>Ensure SUCCESS_URL env var contains <code>{'{CHECKOUT_SESSION_ID}'}</code> (example below).</li>
                  <li>If your server created the session in live mode, STRIPE_SECRET_KEY must be the live secret key.</li>
                </ul>
                <div style={{ marginTop:8, background:'#f8fafc', padding:8, borderRadius:6 }}>
                  Recommended SUCCESS_URL (Vercel env): <code>https://www.novahunt.ai/checkout-success?session_id={'{CHECKOUT_SESSION_ID}'}</code>
                </div>
              </div>

              <div style={{ marginTop:14, display:'flex', gap:12 }}>
                <Link href="/signin"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Sign In</a></Link>
                <Link href="/forgot"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Forgot password</a></Link>
                <Link href="/plans"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Plans</a></Link>
              </div>
            </div>
          </>
        )}

        {status === 'error' && message && (
          <div style={{ marginTop:16, color:'#ef4444' }}>
            <strong>Error:</strong> {message}
          </div>
        )}
      </div>
    </div>
  );
}
