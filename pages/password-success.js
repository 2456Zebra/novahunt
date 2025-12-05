// pages/password-success.js
// Passive success page for flows that route here. Uses the same copy as checkout-success.
// Sign In will attempt to sign-in using stored prefill credentials and then go to /dashboard.

import { useEffect, useState } from 'react';
import Router from 'next/router';

export default function PasswordSuccess() {
  const [status, setStatus] = useState('working'); // working | ok | error | nosession
  const [message, setMessage] = useState('Processing your account…');
  const [manualLoading, setManualLoading] = useState(false);

  useEffect(() => {
    (async function trySignIn() {
      try {
        // If already signed in
        if (window.supabase?.auth?.getSession) {
          const { data } = await window.supabase.auth.getSession();
          if (data?.session?.user) {
            setStatus('ok');
            setMessage('Thanks — your password has been registered.');
            return;
          }
        }

        // Look for pending credentials (written by set-password)
        const email = sessionStorage.getItem('auth_pending_email');
        const password = sessionStorage.getItem('auth_pending_password');

        if (!email || !password) {
          setStatus('nosession');
          setMessage('Thanks — your password has been registered.');
          return;
        }

        if (!window.supabase?.auth?.signInWithPassword) {
          setStatus('error');
          setMessage('Auth client not initialized.');
          return;
        }

        const { error } = await window.supabase.auth.signInWithPassword({ email, password });

        // keep auth_prefill_* for fallback, but remove pending
        try {
          sessionStorage.removeItem('auth_pending_email');
          sessionStorage.removeItem('auth_pending_password');
        } catch (e) {}

        if (error) {
          setStatus('error');
          setMessage(error.message || 'Sign-in failed.');
          return;
        }

        // Poll for session persistence
        let attempts = 0;
        const maxAttempts = 20;
        let sessionFound = false;
        while (attempts < maxAttempts) {
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 250));
          // eslint-disable-next-line no-await-in-loop
          const s = await window.supabase.auth.getSession();
          if (s?.data?.session?.user) {
            sessionFound = true;
            break;
          }
          attempts += 1;
        }

        if (sessionFound) {
          setStatus('ok');
          setMessage('Thanks — your password has been registered.');
          return;
        }

        setStatus('error');
        setMessage('Signed in but session did not persist. Click Sign In below.');
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
        // fallback to set-password if stripe_email present, else signin page
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
        setMessage(error.message || 'Sign in failed.');
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
    <main className="psuccess-root">
      <div className="psuccess-card" role="status" aria-live="polite">
        <h1 className="psuccess-title">Success</h1>

        <p className="psuccess-message" style={{ marginTop: 6 }}>
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
