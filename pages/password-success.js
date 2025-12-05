// pages/password-success.js
// Attempts an automatic sign-in using credentials saved in sessionStorage by the Set Password page.
// Shows a "Success — you'll be redirected to your Dashboard" message and a countdown only when auto sign-in succeeds.
// If credentials were not present or sign-in fails, the page stays visible and offers a "Sign in" button (it will NOT auto-redirect to /signin).

import { useEffect, useState } from 'react';
import Router from 'next/router';

// styles/password-success.css is imported globally from pages/_app.js per Next.js rules.

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
          // Don't auto-redirect to SignIn — instead show the success page and let user sign in manually
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

        const { data, error } = await window.supabase.auth.signInWithPassword({ email, password });

        // Clear pending credentials immediately
        sessionStorage.removeItem('auth_pending_email');
        sessionStorage.removeItem('auth_pending_password');

        if (error) {
          setStatus('error');
          setMessage(error.message || 'Sign-in failed.');
          return;
        }

        if (data?.user || data?.session) {
          setStatus('ok');
          setMessage('Signed in — redirecting to your dashboard…');
          return;
        }

        setStatus('error');
        setMessage('Sign-in returned no session. Please sign in manually.');
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
    Router.push(redirectTo);
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
            <a className="btn btn-primary" href="/signin">Sign in</a>
            <a className="btn btn-link" href="/">Return home</a>
          </div>
        )}

        <div className="psuccess-note">
          If you are not redirected automatically, click "Go to Dashboard now".
        </div>
      </div>
    </main>
  );
}
