// pages/password-success.js
// Updated: removed any "set your password" / "payment successful" copy and countdown messages.
// The Sign In action now attempts to sign the user in using stored prefill credentials
// (auth_prefill_email / auth_prefill_password). If those are available it performs sign-in
// and navigates to /dashboard once the session persists. If prefill is missing it falls back
// to opening the standard Sign In page.
//
// This page stays visible (no automatic redirect) and shows the new copy requested:
// "Thanks — your password has been registered." when appropriate.

import { useEffect, useState } from 'react';
import Router from 'next/router';

export default function PasswordSuccess() {
  const [redirectTo, setRedirectTo] = useState('/dashboard');
  const [status, setStatus] = useState('working'); // working | ok | error | nosession
  const [message, setMessage] = useState('Signing you in…');
  const [manualLoading, setManualLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const r = params.get('redirectTo') || params.get('redirect') || '/dashboard';
    setRedirectTo(r);

    (async function trySignIn() {
      try {
        // If a session already exists, show signed-in state and new copy.
        if (window.supabase?.auth?.getSession) {
          const { data } = await window.supabase.auth.getSession();
          if (data?.session?.user) {
            setStatus('ok');
            setMessage('Thanks — your password has been registered.');
            return;
          }
        }

        // Read pending credentials from sessionStorage (set by Set Password page)
        const email = sessionStorage.getItem('auth_pending_email');
        const password = sessionStorage.getItem('auth_pending_password');

        if (!email || !password) {
          // Nothing to auto sign-in with; show confirmation copy and let user sign in manually
          setStatus('nosession');
          setMessage('Thanks — your password has been registered.');
          return;
        }

        if (!window.supabase?.auth?.signInWithPassword) {
          setStatus('error');
          setMessage('Supabase client not initialized on this page.');
          return;
        }

        // Attempt sign-in using the just-created credentials
        const { error: signError } = await window.supabase.auth.signInWithPassword({ email, password });

        // Remove the pending plaintext credentials (we keep auth_prefill_* elsewhere for fallback)
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
          setMessage('Thanks — your password has been registered.');
          return;
        }

        // signIn call succeeded but session didn't persist in time: leave page visible for manual action
        setStatus('error');
        setMessage('Signed in but session did not persist in time. Click "Sign in" below.');
      } catch (err) {
        setStatus('error');
        setMessage(String(err?.message || err));
      }
    })();
  }, []);

  async function handleManualSignIn() {
    // Try to sign in with prefill credentials (so user only has to click this button)
    setManualLoading(true);
    setMessage('');
    try {
      const email = sessionStorage.getItem('auth_prefill_email') || sessionStorage.getItem('auth_pending_email');
      const password = sessionStorage.getItem('auth_prefill_password') || sessionStorage.getItem('auth_pending_password');

      if (!email || !password) {
        // No prefill available — fall back to opening the Sign In page where they can type
        setManualLoading(false);
        Router.push('/signin');
        return;
      }

      if (!window.supabase?.auth?.signInWithPassword) {
        setManualLoading(false);
        setMessage('Supabase client not ready.');
        return;
      }

      const { error } = await window.supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setManualLoading(false);
        setMessage(error.message || 'Sign in failed. You can use the Sign In page instead.');
        return;
      }

      // keep auth_prefill_* until we confirm session persisted — don't remove yet
      // Poll for session persistence
      const maxAttempts = 20;
      let attempts = 0;
      let sessionFound = false;
      while (attempts < maxAttempts) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((res) => setTimeout(res, 200));
        // eslint-disable-next-line no-await-in-loop
        const sObj = await window.supabase.auth.getSession();
        if (sObj?.data?.session?.user) {
          sessionFound = true;
          break;
        }
        attempts += 1;
      }

      if (sessionFound) {
        // Clear sensitive prefill values after success
        try {
          sessionStorage.removeItem('auth_prefill_email');
          sessionStorage.removeItem('auth_prefill_password');
          sessionStorage.removeItem('auth_pending_email');
          sessionStorage.removeItem('auth_pending_password');
          sessionStorage.removeItem('stripe_email');
        } catch (e) {}

        // Navigate to dashboard where header will show authenticated user
        Router.push(redirectTo);
        return;
      }

      // If no session found, fallback to signin page so user can retry manually
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
          {/* New copy requested: confirm password registration */}
          {status === 'working' && 'Processing — preparing your account.'}
          {(status === 'ok' || status === 'nosession') && 'Thanks — your password has been registered.'}
          {status === 'error' && `There was an issue: ${message}`}
        </p>

        <div className="psuccess-actions" style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
          <button
            className="btn btn-primary"
            onClick={handleManualSignIn}
            disabled={manualLoading}
            aria-busy={manualLoading}
          >
            {manualLoading ? 'Signing in…' : 'Sign In'}
          </button>

          <button
            className="btn btn-link"
            onClick={() => Router.push('/signin')}
            style={{ marginLeft: 6 }}
          >
            Sign in manually
          </button>
        </div>

        {message && status !== 'ok' && (
          <div className="psuccess-note" style={{ marginTop: 12, color: '#374151' }}>
            {message}
          </div>
        )}
      </div>
    </main>
  );
}
