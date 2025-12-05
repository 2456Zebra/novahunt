// pages/password-success.js
// Passive success page: no countdown redirect, does not remove auth_prefill_*, and does not auto-navigate to /signin.

import { useEffect, useState } from 'react';
import Router from 'next/router';

export default function PasswordSuccess() {
  const [redirectTo, setRedirectTo] = useState('/dashboard');
  const [status, setStatus] = useState('working'); // working | ok | error | nosession
  const [message, setMessage] = useState('Signing you in…');

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const r = params.get('redirectTo') || params.get('redirect') || '/dashboard';
    setRedirectTo(r);

    (async function trySignIn() {
      try {
        // If a session already exists, indicate ok and let user continue when ready.
        if (window.supabase?.auth?.getSession) {
          const { data } = await window.supabase.auth.getSession();
          if (data?.session?.user) {
            setStatus('ok');
            setMessage('You are signed in.');
            return;
          }
        }

        // Read pending credentials that the Set Password page stored.
        const email = sessionStorage.getItem('auth_pending_email');
        const password = sessionStorage.getItem('auth_pending_password');

        if (!email || !password) {
          // Nothing to auto sign-in with: show success state without sign-in prompt.
          setStatus('nosession');
          setMessage('Your password has been set. Click "Go to Sign In" to sign in (the form will be prefilled).');
          return;
        }

        if (!window.supabase?.auth?.signInWithPassword) {
          setStatus('error');
          setMessage('Supabase client not initialized on this page.');
          return;
        }

        // Attempt sign-in (do not clear auth_prefill_*)
        const { error: signError } = await window.supabase.auth.signInWithPassword({ email, password });

        // Clear only pending values (used for auto sign-in); leave auth_prefill_* intact.
        try {
          sessionStorage.removeItem('auth_pending_email');
          sessionStorage.removeItem('auth_pending_password');
        } catch (e) {}

        if (signError) {
          setStatus('error');
          setMessage(signError.message || 'Sign-in failed.');
          return;
        }

        // Poll for session persistence briefly
        const maxAttempts = 20;
        let attempts = 0;
        let sessionFound = false;
        while (attempts < maxAttempts) {
          // eslint-disable-next-line no-await-in-loop
          await new Promise((res) => setTimeout(res, 250));
          // eslint-disable-next-line no-await-in-loop
          const sObj = await window.supabase.auth.getSession();
          if (sObj?.data?.session?.user) {
            sessionFound = true;
            break;
          }
          attempts += 1;
        }

        if (sessionFound) {
          setStatus('ok');
          setMessage('Signed in successfully. Click "Go to Dashboard" when ready.');
          return;
        }

        // signIn call succeeded (no error) but session didn't persist in time: keep page and let user continue.
        setStatus('error');
        setMessage('Signed in but session did not persist. Click "Go to Sign In" and press Sign In.');
      } catch (err) {
        setStatus('error');
        setMessage(String(err?.message || err));
      }
    })();
  }, []);

  function goToDashboard() {
    Router.push(redirectTo);
  }

  function goToSignIn() {
    Router.push('/signin');
  }

  return (
    <main className="psuccess-root">
      <div className="psuccess-card" role="status" aria-live="polite">
        <h1 className="psuccess-title">Success</h1>

        <p className="psuccess-message">
          {status === 'working' && 'Signing you in and preparing your dashboard…'}
          {status === 'ok' && 'You are signed in. When ready, go to your Dashboard.'}
          {status === 'nosession' && 'Your password has been set. Click "Go to Sign In" to sign in.'}
          {status === 'error' && `There was an issue: ${message}`}
        </p>

        <div className="psuccess-actions" style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
          <button className="btn btn-primary" onClick={goToDashboard} aria-disabled={status !== 'ok'}>
            Go to Dashboard
          </button>

          <button className="btn btn-link" onClick={goToSignIn}>
            Go to Sign In
          </button>
        </div>

        <div className="psuccess-note" style={{ marginTop: 12 }}>
          The Sign In page will be prefilled so you only need to click Sign in if needed.
        </div>
      </div>
    </main>
  );
}
