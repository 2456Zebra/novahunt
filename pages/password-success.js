import { useEffect, useState } from 'react';
import Router from 'next/router';

// Defensive password-success page that attempts auto sign-in and prevents
// client-side redirects to the plain Sign In page while it is active.
// Note: server-side (HTTP) redirects cannot be blocked by client JS.

export default function PasswordSuccess() {
  const [redirectTo, setRedirectTo] = useState('/');
  const [seconds, setSeconds] = useState(5);
  const [status, setStatus] = useState('working'); // working | ok | error | nosession
  const [message, setMessage] = useState('Signing you in…');

  useEffect(() => {
    // Defensive interceptors to block client-side redirects to "/signin" while this page is mounted.
    const origRouterPush = Router.push.bind(Router);
    const origRouterReplace = Router.replace.bind(Router);
    const safeMatch = (u) => {
      try {
        const s = typeof u === 'string' ? u : (u?.pathname || '');
        return typeof s === 'string' && s.includes('/signin');
      } catch {
        return false;
      }
    };

    Router.push = (...args) => {
      if (safeMatch(args[0])) {
        console.log('[password-success] blocked Router.push to', args[0]);
        // return a resolved promise to mimic Router.push behaviour but do nothing
        return Promise.resolve(false);
      }
      return origRouterPush(...args);
    };

    Router.replace = (...args) => {
      if (safeMatch(args[0])) {
        console.log('[password-success] blocked Router.replace to', args[0]);
        return Promise.resolve(false);
      }
      return origRouterReplace(...args);
    };

    // Patch location.assign/replace
    const origAssign = window.location.assign.bind(window.location);
    const origReplaceLoc = window.location.replace.bind(window.location);

    window.location.assign = (url) => {
      if (typeof url === 'string' && url.includes('/signin')) {
        console.log('[password-success] blocked location.assign to', url);
        return;
      }
      return origAssign(url);
    };
    window.location.replace = (url) => {
      if (typeof url === 'string' && url.includes('/signin')) {
        console.log('[password-success] blocked location.replace to', url);
        return;
      }
      return origReplaceLoc(url);
    };

    // Cleanup on unmount: restore originals.
    return () => {
      Router.push = origRouterPush;
      Router.replace = origRouterReplace;
      window.location.assign = origAssign;
      window.location.replace = origReplaceLoc;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('redirectTo') || params.get('redirect') || '/';
    const s = parseInt(params.get('seconds') || params.get('sec') || '', 10);
    setRedirectTo(r);
    if (!Number.isNaN(s) && s > 0) setSeconds(s);

    (async function trySignIn() {
      try {
        // If session already present, go ok
        if (window.supabase?.auth?.getSession) {
          const { data } = await window.supabase.auth.getSession();
          if (data?.session?.user) {
            setStatus('ok');
            setMessage('Already signed in — redirecting…');
            return;
          }
        }

        // Read pending credentials from sessionStorage
        const email = sessionStorage.getItem('auth_pending_email');
        const password = sessionStorage.getItem('auth_pending_password');

        if (!email || !password) {
          setStatus('nosession');
          setMessage('Your password is set. Click "Go to Sign In" to sign in.');
          return;
        }

        if (!window.supabase?.auth?.signInWithPassword) {
          setStatus('error');
          setMessage('Supabase client not initialized on this page.');
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
          setMessage('Signed in — redirecting to your dashboard…');
          return;
        }

        // signIn succeeded but session didn't persist in time. Provide prefill for manual Sign In.
        setStatus('error');
        setMessage('Signed in but session did not persist in time. Click "Go to Sign In" and press Sign In.');
        try {
          sessionStorage.setItem('auth_prefill_email', email);
          sessionStorage.setItem('auth_prefill_password', password);
        } catch (err) { /* ignore */ }
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
      // use Router.push to navigate to dashboard — this will work because we're allowing non-signin routes
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
    // If not signed in or session not persisted, go to Sign In page where fields will be prefilled.
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
