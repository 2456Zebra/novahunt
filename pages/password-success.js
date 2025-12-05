// pages/password-success.js
// Aggressive client-side guard to keep the user on this page after they set a password.
// - Patches Router.push/replace and window.location.assign/replace as early as possible (module load time).
// - Logs stack traces for blocked navigations so we can find the caller.
// - Attempts automatic sign-in using credentials saved in sessionStorage by Set Password page.
// - Does NOT auto-redirect to /signin. The user clicks "Go to Dashboard" or "Go to Sign In" manually.
//
// NOTE: styles/password-success.css must be imported globally from pages/_app.js per Next.js rules.

import { useEffect, useState } from 'react';
import Router from 'next/router';

// Module-scope defensive patches (run as early as possible on the client).
if (typeof window !== 'undefined') {
  try {
    // Patch next/router if available
    try {
      const nextRouter = require('next/router');
      const origPush = nextRouter.push.bind(nextRouter);
      const origReplace = nextRouter.replace.bind(nextRouter);

      const blockIfSignin = (url) => {
        try {
          const s = typeof url === 'string' ? url : (url?.pathname || url?.toString?.() || '');
          if (String(s).includes('/signin')) {
            console.warn('[password-success] blocked Router navigation to', s, '\nStack:', new Error().stack);
            return true;
          }
        } catch (err) { /* ignore */ }
        return false;
      };

      nextRouter.push = (...args) => {
        if (blockIfSignin(args[0])) return Promise.resolve(false);
        return origPush(...args);
      };
      nextRouter.replace = (...args) => {
        if (blockIfSignin(args[0])) return Promise.resolve(false);
        return origReplace(...args);
      };
    } catch (e) {
      // next/router may not be available very early; ignore errors
      // console.warn('next/router patch failed', e);
    }

    // Patch window.location.assign / replace
    const origAssign = window.location.assign.bind(window.location);
    const origReplaceLoc = window.location.replace.bind(window.location);
    window.location.assign = (url) => {
      try {
        if (typeof url === 'string' && url.includes('/signin')) {
          console.warn('[password-success] blocked location.assign to', url, '\nStack:', new Error().stack);
          return;
        }
      } catch (err) {}
      return origAssign(url);
    };
    window.location.replace = (url) => {
      try {
        if (typeof url === 'string' && url.includes('/signin')) {
          console.warn('[password-success] blocked location.replace to', url, '\nStack:', new Error().stack);
          return;
        }
      } catch (err) {}
      return origReplaceLoc(url);
    };

    // Optional: detect assignments to location.href by polling a moment after load.
    // This cannot fully prevent assignment, but it catches many redirect attempts done in JS after a short delay.
    let lastHref = window.location.href;
    const hrefWatcher = setInterval(() => {
      if (window.location.href !== lastHref) {
        if (window.location.href.includes('/signin')) {
          console.warn('[password-success] detected href change to /signin and will navigate back. Stack unknown.');
          // navigate back to this page after brief delay (attempt to keep user here)
          setTimeout(() => {
            try { window.history.replaceState({}, '', window.location.pathname); } catch (e) {}
            try { window.location.href = window.location.href; } catch (e) {}
          }, 50);
        }
        lastHref = window.location.href;
      }
    }, 150);
    // Make the watcher accessible to the component for cleanup
    window.__psuccess_href_watcher = hrefWatcher;
  } catch (err) {
    // Don't crash if anything here fails
    // console.warn('password-success early patch failed', err);
  }
}

export default function PasswordSuccess() {
  const [redirectTo, setRedirectTo] = useState('/dashboard');
  const [status, setStatus] = useState('working'); // working | ok | error | nosession
  const [message, setMessage] = useState('Signing you in…');

  useEffect(() => {
    // Clean up the href watcher when leaving the component
    return () => {
      try {
        if (typeof window !== 'undefined' && window.__psuccess_href_watcher) {
          clearInterval(window.__psuccess_href_watcher);
          delete window.__psuccess_href_watcher;
        }
      } catch (e) {}
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const r = params.get('redirectTo') || params.get('redirect') || '/dashboard';
    setRedirectTo(r);

    (async function trySignIn() {
      try {
        // If there's already a persisted session, indicate success
        if (window.supabase?.auth?.getSession) {
          const { data } = await window.supabase.auth.getSession();
          if (data?.session?.user) {
            setStatus('ok');
            setMessage('You are signed in.');
            return;
          }
        }

        // Read pending credentials from sessionStorage
        const email = sessionStorage.getItem('auth_pending_email');
        const password = sessionStorage.getItem('auth_pending_password');

        if (!email || !password) {
          setStatus('nosession');
          setMessage('Your password has been set. Click "Go to Sign In" to sign in (form will be prefilled).');
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

        // Clear pending plaintext credentials (we'll provide prefill if needed)
        sessionStorage.removeItem('auth_pending_email');
        sessionStorage.removeItem('auth_pending_password');

        if (signError) {
          setStatus('error');
          setMessage(signError.message || 'Sign-in failed.');
          return;
        }

        // Poll for session persistence for a short window
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

        // signIn succeeded but session didn't persist in time — keep page and prefill sign-in
        setStatus('error');
        setMessage('Signed in but session did not persist. Click "Go to Sign In" and press Sign In.');
        try {
          sessionStorage.setItem('auth_prefill_email', email);
          sessionStorage.setItem('auth_prefill_password', password);
        } catch (err) {
          // ignore
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
          The sign-in form will be prefilled if needed so you only need to click Sign In.
        </div>
      </div>
    </main>
  );
}
