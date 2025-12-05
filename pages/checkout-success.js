import { useEffect, useState } from 'react';
import Router from 'next/router';

/**
 * pages/checkout-success.js
 * - Replaces older "Payment successful" flow UI
 * - No countdown or automatic redirect
 * - Sign In button will attempt to sign in using stored prefill credentials and go to /dashboard
 * - Falls back to /set-password (if stripe_email exists) or /signin if no credentials
 *
 * NOTE: Ensure styles imported globally from pages/_app.js
 */

export default function CheckoutSuccess() {
  const [status, setStatus] = useState('working'); // working | ok | error | nosession
  const [message, setMessage] = useState('Processing your account…');
  const [manualLoading, setManualLoading] = useState(false);

  useEffect(() => {
    (async function init() {
      try {
        // If already signed in, show success copy
        if (window.supabase?.auth?.getSession) {
          const { data } = await window.supabase.auth.getSession();
          if (data?.session?.user) {
            setStatus('ok');
            setMessage('Thanks — your password has been registered.');
            return;
          }
        }

        // If Stripe passed email in query param, store it for set-password prefill
        try {
          const params = new URLSearchParams(window.location.search);
          const eParam = params.get('email') || params.get('customer_email');
          if (eParam) {
            sessionStorage.setItem('stripe_email', eParam);
          }
        } catch (e) {}

        // If prefill credentials exist, indicate ready
        const prefEmail = sessionStorage.getItem('auth_prefill_email') || sessionStorage.getItem('auth_pending_email');
        const prefPass = sessionStorage.getItem('auth_prefill_password') || sessionStorage.getItem('auth_pending_password');
        if (prefEmail && prefPass) {
          setStatus('nosession');
          setMessage('Thanks — your password has been registered.');
          return;
        }

        // Default: show success copy (user can click Sign In)
        setStatus('nosession');
        setMessage('Thanks — your password has been registered.');
      } catch (err) {
        setStatus('error');
        setMessage(String(err?.message || err));
      }
    })();
  }, []);

  async function handleSignIn() {
    setManualLoading(true);
    setMessage('');
    try {
      const email = sessionStorage.getItem('auth_prefill_email') || sessionStorage.getItem('auth_pending_email') || sessionStorage.getItem('stripe_email');
      const password = sessionStorage.getItem('auth_prefill_password') || sessionStorage.getItem('auth_pending_password');

      if (!email || !password) {
        setManualLoading(false);
        if (sessionStorage.getItem('stripe_email')) {
          Router.push('/set-password');
        } else {
          Router.push('/signin');
        }
        return;
      }

      if (!window.supabase?.auth?.signInWithPassword) {
        setManualLoading(false);
        setMessage('Auth client not ready.');
        return;
      }

      const { error } = await window.supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setManualLoading(false);
        setMessage(error.message || 'Sign in failed. Use the Sign In page.');
        return;
      }

      // Poll for session persistence
      let attempts = 0;
      const maxAttempts = 20;
      let sessionFound = false;
      while (attempts < maxAttempts) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 200));
        // eslint-disable-next-line no-await-in-loop
        const s = await window.supabase.auth.getSession();
        if (s?.data?.session?.user) {
          sessionFound = true;
          break;
        }
        attempts += 1;
      }

      if (sessionFound) {
        // Clear sensitive prefill after success
        try {
          sessionStorage.removeItem('auth_prefill_email');
          sessionStorage.removeItem('auth_prefill_password');
          sessionStorage.removeItem('auth_pending_email');
          sessionStorage.removeItem('auth_pending_password');
          sessionStorage.removeItem('stripe_email');
        } catch (e) {}
        Router.push('/dashboard');
        return;
      }

      setManualLoading(false);
      setMessage('Could not establish session immediately — opening Sign In page for you.');
      Router.push('/signin');
    } catch (err) {
      setManualLoading(false);
      setMessage(String(err?.message || err));
    }
  }

  return (
    <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 720, background: '#fff', borderRadius: 10, padding: 28, boxShadow: '0 10px 30px rgba(12,25,40,0.06)', border: '1px solid #eef2f6', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Success</h1>
        <p style={{ marginTop: 10, color: '#374151' }}>
          {(status === 'working') && 'Processing your account…'}
          {(status === 'ok' || status === 'nosession') && 'Thanks — your password has been registered.'}
          {status === 'error' && `There was an issue: ${message}`}
        </p>

        <div style={{ marginTop: 18, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={handleSignIn} disabled={manualLoading} style={{ padding: '10px 14px', background: '#0b5fff', color: '#fff', border: 0, borderRadius: 8 }}>
            {manualLoading ? 'Signing in…' : 'Sign In'}
          </button>

          <button onClick={() => Router.push('/signin')} style={{ padding: '10px 12px', background: 'transparent', color: '#0b5fff', border: '1px solid transparent', borderRadius: 8 }}>
            Sign in manually
          </button>
        </div>

        {message && <div style={{ marginTop: 12, color: '#374151' }}>{message}</div>}
      </div>
    </main>
  );
}
