// pages/password-success.js
// Attempts automatic sign-in using credentials stored in sessionStorage by the Set Password page.
// If session persistence succeeds, shows the "redirecting to Dashboard" countdown and navigates to redirectTo.
// IMPORTANT: This page will NOT automatically redirect users to /signin. If auto-sign-in fails or session doesn't persist,
// it stays visible and offers a "Go to Sign In" button that opens /signin with the credentials prefilled.

import { useEffect, useState } from 'react';
import Router from 'next/router';

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
        // If there is already a session, go to ok state
        if (window.supabase?.auth?.getSession) {
          const { data } = await window.supabase.auth.getSession();
          if (data?.session?.user) {
            setStatus('ok');
            setMessage('Already signed in — redirecting…');
            return;
          }
        }

        // Get pending credentials
        const email = sessionStorage.getItem('auth_pending_email');
        const password = sessionStorage.getItem('auth_pending_password');

        if (!email || !password) {
          // No credentials to auto-sign-in with. Stay on page and show Sign In button.
          setStatus('nosession');
          setMessage('Your password was set. Click "Go to Sign In" to sign in (we will prefill your email).');
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
        const { data: signData, error: signError } = await window.supabase.auth.signInWithPassword({ email, password });

        // Remove the pending plaintext credentials (we'll store prefill values if needed)
        sessionStorage.removeItem('auth_pending_email');
        sessionStorage.removeItem('auth_pending_password');

        if (signError) {
          setStatus('error');
          setMessage(signError.message || 'Sign-in failed.');
          return;
        }

        // Poll for session persistence (some environments persist asynchronously)
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
          setMessage('Signed in — redirecting to your dashboard…');
          return;
        }

        // signIn succeeded but session didn't persist within timeout. Provide prefill and let user go to Sign In.
        setStatus('error');
        setMessage('Signed in but session did not persist in time. Click "Go to Sign In" and press Sign In.');
        // store prefill values for the Sign In page (short-lived, tab-scoped)
        try {
          sessionStorage.setItem('auth_prefill_email', email);
          sessionStorage.setItem('auth_prefill_password', password);
        } catch (err) {
          // ignore sessionStorage write failures
        }
      } catch (err) {
        setStatus('error');
        setMessage(String(err?.message || err));
      }
    })();
  }, []);

  // Start countdown only when status === 'ok'
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
    // user intentionally chooses to go to Sign In; the Sign In page will pick up prefill values (if any)
    Router.push('/signin');
  }

  return (
    <main className="psuccess-root">
      <div className="psuccess-card" role="status" aria-live="polite">
        <h1 className="psuccess-title">Success</h1>

        <p className="psuccess-message">
          {status === 'working' && 'Signing you in and preparing your dashboard…'}
          {status === 'ok' && 'Your account is ready — you will be redirected to your Dashboard.'}
          {status === 'nosession' && 'Your password is set. Click "Go to Sign In" to sign in.'}
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
