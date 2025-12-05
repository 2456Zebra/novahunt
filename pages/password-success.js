// pages/password-success.js
// Updated: removed automatic countdown redirect and removed "set your password" copy.
// This page will:
// - attempt automatic sign-in using credentials saved in sessionStorage by Set Password page.
// - if sign-in + session persistence succeeds, show a confirmation and let the user click "Go to Dashboard".
// - if sign-in fails or session persistence doesn't appear, keep the page visible and store prefill values
//   for the Sign In page so the user can click "Go to Sign In" and only press the Sign In button there.
//
// NOTE: styles/password-success.css must be imported globally from pages/_app.js per Next.js rules.

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
        // If a session already exists, go ok
        if (window.supabase?.auth?.getSession) {
          const { data } = await window.supabase.auth.getSession();
          if (data?.session?.user) {
            setStatus('ok');
            setMessage('You are signed in.');
            return;
          }
        }

        // Read pending credentials from sessionStorage (set by set-password page)
        const email = sessionStorage.getItem('auth_pending_email');
        const password = sessionStorage.getItem('auth_pending_password');

        if (!email || !password) {
          // Nothing to auto sign-in with; remain on page and allow manual sign-in
          setStatus('nosession');
          setMessage('Your password was set. Click "Go to Sign In" to sign in.');
          return;
        }

        if (!window.supabase?.auth?.signInWithPassword) {
          setStatus('error');
          setMessage('Supabase client not initialized on this page.');
          // Clear sensitive pending values
          sessionStorage.removeItem('auth_pending_email');
          sessionStorage.removeItem('auth_pending_password');
          return;
        }

        // Attempt sign-in
        const { error: signError } = await window.supabase.auth.signInWithPassword({ email, password });

        // Remove the pending plaintext credentials (we'll store prefill if needed)
        sessionStorage.removeItem('auth_pending_email');
        sessionStorage.removeItem('auth_pending_password');

        if (signError) {
          setStatus('error');
          setMessage(signError.message || 'Sign-in failed.');
          return;
        }

        // Poll for session persistence (some envs persist asynchronously)
        const maxAttempts = 20;
        let attempts = 0;
        let sessionFound = false;
        while (attempts < maxAttempts) {
          // small delay
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
          setMessage('Signed in successfully. Click "Go to Dashboard" when you are ready.');
          return;
        }

        // signIn succeeded but session didn't persist in time. Provide prefill and stay here.
        setStatus('error');
        setMessage('Signed in but session did not persist. Click "Go to Sign In" and press Sign In.');
        try {
          sessionStorage.setItem('auth_prefill_email', email);
          sessionStorage.setItem('auth_prefill_password', password);
        } catch (err) {
          // ignore sessionStorage failures
        }
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
          {/* Removed any "set your password" copy — user already did that on the previous page. */}
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
          If you prefer, click "Go to Sign In" — the sign-in form will be prefilled so you only need to click Sign in.
        </div>
      </div>
    </main>
  );
}
