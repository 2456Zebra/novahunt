import { useEffect, useState } from 'react';
import Router from 'next/router';

// pages/password-success.js
// Tries to sign the user in using credentials saved in sessionStorage by the Set Password page.
// If sign-in returns successfully, waits for Supabase session persistence before redirecting.
// If session fails to appear, stays on the page and offers a "Go to Sign In" button that will
// prefill the Sign In page (via sessionStorage) so the user only needs to click Sign In.

export default function PasswordSuccess() {
  const [redirectTo, setRedirectTo] = useState('/');
  const [seconds, setSeconds] = useState(5);
  const [status, setStatus] = useState('working'); // working | ok | error | nosession
  const [message, setMessage] = useState('Signing you in…');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('redirectTo') || params.get('redirect') || '/';
    const s = parseInt(params.get('seconds') || params.get('sec') || '', 10);
    setRedirectTo(r);
    if (!Number.isNaN(s) && s > 0) setSeconds(s);

    (async function trySignIn() {
      try {
        // If a session already exists, skip sign-in
        if (window.supabase?.auth?.getSession) {
          const { data } = await window.supabase.auth.getSession();
          if (data?.session?.user) {
            setStatus('ok');
            setMessage('Already signed in — redirecting…');
            return;
          }
        }

        // Read pending credentials from sessionStorage (set by set-password page)
        const email = sessionStorage.getItem('auth_pending_email');
        const password = sessionStorage.getItem('auth_pending_password');

        if (!email || !password) {
          // No credentials: remain on success page and let user sign in manually
          setStatus('nosession');
          setMessage('Password set. Please sign in to access your dashboard.');
          return;
        }

        if (!window.supabase?.auth?.signInWithPassword) {
          setStatus('error');
          setMessage('Supabase client not initialized on this page.');
          // Clear pending credentials for safety
          sessionStorage.removeItem('auth_pending_email');
          sessionStorage.removeItem('auth_pending_password');
          return;
        }

        // Attempt sign in
        const { data: signData, error: signError } = await window.supabase.auth.signInWithPassword({ email, password });

        // Clear pending credentials immediately after the attempt
        sessionStorage.removeItem('auth_pending_email');
        sessionStorage.removeItem('auth_pending_password');

        if (signError) {
          setStatus('error');
          setMessage(signError.message || 'Sign-in failed.');
          return;
        }

        // If signIn returned no error, wait for the session to be available (some envs persist asynchronously)
        // Poll for session presence for up to ~5 seconds.
        const maxAttempts = 20;
        let attempts = 0;
        let sessionFound = false;
        while (attempts < maxAttempts) {
          // eslint-disable-next-line no-await-in-loop
          const s = await window.supabase.auth.getSession();
          if (s?.data?.session?.user) {
            sessionFound = true;
            break;
          }
          // wait 250ms
          // eslint-disable-next-line no-await-in-loop
          await new Promise((res) => setTimeout(res, 250));
          attempts += 1;
        }

        if (sessionFound) {
          setStatus('ok');
          setMessage('Signed in — redirecting to your dashboard…');
          return;
        }

        // Sign-in call succeeded but session didn't persist in time. Don't auto-redirect to /signin.
        // Offer the user to go to Sign In page with credentials prefilled so they can click Sign In.
        setStatus('error');
        setMessage('Signed in but session did not persist. Click "Go to Sign In" and press Sign In.');
        // store prefill values for the Sign In page (tab-scoped). Use only for immediate next navigation.
        sessionStorage.setItem('auth_prefill_email', email);
        sessionStorage.setItem('auth_prefill_password', password);
      } catch (err) {
        setStatus('error');
        setMessage(String(err?.message || err));
      }
    })();
  }, []);

  // countdown + redirect only when status === 'ok'
  useEffect(() => {
    if (status !== 'ok') return;
    if (seconds <= 0) {
      Router.push(redirectTo);
      return;
    }
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(t);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [status, seconds, redirectTo]);

  function goNow() {
    if (status === 'ok') {
      Router.push(redirectTo);
      return;
    }
    // If not signed in, go to Sign In and let the Sign In page pick up prefill values.
    Router.push('/signin');
  }

  return (
    <main className="psuccess-root">
      <div className="psuccess-card" role="status" aria-live="polite">
        <h1 className="psuccess-title">Success</h1>

        <p className="psuccess-message">
          {status === 'working' && 'Signing you in and preparing your dashboard…'}
          {status === 'ok' && 'Your account is ready — you will be redirected to your Dashboard.'}
          {status === 'nosession' && 'Password set. Please sign in to access your dashboard.'}
          {status === 'error' && `There was a problem: ${message}`}
        </p>

        {status === 'ok' && (
          <>
            <div className="psuccess-countdown">
              Redirecting in <strong>{seconds}</strong> second{seconds === 1 ? '' : 's'}…
            </div>

            <div className="psuccess-actions">
              <button className="btn btn-primary" onClick={goNow}>Go to Dashboard now</button>
              <a className="btn btn-link" href="/signin">Sign in instead</a>
            </div>
          </>
        )}

        {status === 'working' && (
          <div className="psuccess-loading">
            <div className="spinner" aria-hidden="true"></div>
            <div className="psuccess-note">If this takes more than a few seconds, click "Sign in instead".</div>
          </div>
        )}

        {(status === 'nosession' || status === 'error') && (
          <div className="psuccess-actions">
            <button className="btn btn-primary" onClick={goNow}>Go to Sign In</button>
            <a className="btn btn-link" href="/">Return home</a>
          </div>
        )}

        <div className="psuccess-note">
          If you are not redirected automatically, click "Go to Dashboard now" or "Go to Sign In".
        </div>
      </div>
    </main>
  );
}
