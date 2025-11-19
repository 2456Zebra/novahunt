import { useState } from 'react';

/**
 * Modal used for Sign in / Sign up / Reset password flows.
 *
 * UX fix: After a successful sign up we hide the original form so the
 * "Create account" button cannot be pressed again. We also remove the
 * ambiguous "Stay here" button and show one clear primary action:
 * "Back to dashboard" (or you can swap to "Set password" if required).
 *
 * This file is a drop-in replacement for the previous SignInModal.jsx.
 * Copy/paste this content to overwrite the existing file on your branch.
 */
export default function SignInModal({ onClose }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [justSignedIn, setJustSignedIn] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setProcessing(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'signup') {
        // Create account
        const res = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: String(email || '').trim(), password }),
        });
        const body = await res.json();
        if (!res.ok) {
          setError(body?.error || 'Could not create account.');
          setProcessing(false);
          return;
        }

        // If signup succeeded, set success state and auto-sign-in if backend handles it
        setMessage('Account created and signed in locally.');
        setJustSignedIn(true);
        setProcessing(false);
        return;
      }

      if (mode === 'signin') {
        // Sign in flow (this should call your signin endpoint / next-auth)
        const res = await fetch('/api/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: String(email || '').trim(), password }),
        });
        const body = await res.json();
        if (!res.ok) {
          setError(body?.error || 'Signin failed. Please check your credentials.');
          setProcessing(false);
          return;
        }
        setMessage('Signed in successfully.');
        setJustSignedIn(true);
        setProcessing(false);
        return;
      }

      if (mode === 'forgot') {
        const res = await fetch('/api/forgot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: String(email || '').trim() }),
        });
        const body = await res.json();
        if (!res.ok) {
          setError(body?.error || 'Could not send reset link.');
          setProcessing(false);
          return;
        }
        setMessage('Reset link sent to your email.');
        setProcessing(false);
        setMode('signin');
      }
    } catch (err) {
      setError('Network or server error. Try again.');
      setProcessing(false);
    }
  }

  function backToDashboard() {
    // If you use client-side routing, replace with router.push('/') as needed
    window.location.href = '/';
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        background: 'rgba(0,0,0,0.4)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'white', padding: '1rem 1.25rem', width: 420, borderRadius: 10, position: 'relative' }}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', fontSize: '1.25rem' }}
          aria-label="Close"
        >
          ×
        </button>

        <h2 style={{ marginTop: 0 }}>
          {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
        </h2>

        {message && <p style={{ color: 'green' }}>{message}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {/* Hide the interactive form after a successful sign-up/sign-in to avoid duplicate submissions */}
        {!justSignedIn && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ padding: '0.6rem', border: '1px solid #ccc', borderRadius: '8px' }}
            />
            {mode !== 'forgot' && (
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ padding: '0.6rem', border: '1px solid #ccc', borderRadius: '8px' }}
              />
            )}

            <button
              type="submit"
              style={{ background: '#111827', color: 'white', padding: '0.6rem', borderRadius: '8px', border: 'none' }}
              disabled={processing}
            >
              {processing ? (mode === 'signup' ? 'Creating…' : 'Signing in…') : (mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create account' : 'Send Reset Link')}
            </button>
          </form>
        )}

        {/* After successful sign-in / sign-up, show one clear action only */}
        {justSignedIn && (
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button
              onClick={backToDashboard}
              style={{ background: '#059669', color: 'white', padding: '0.5rem 0.75rem', borderRadius: '8px', border: 'none' }}
            >
              Back to dashboard
            </button>
          </div>
        )}

        {/* Helper / mode links */}
        {!justSignedIn && (
          <div style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.9rem' }}>
            {mode === 'signin' && (
              <>
                Forgot password? <a href="#" onClick={() => setMode('forgot')} style={{ color: '#007bff' }}>Reset</a> •{' '}
                <a href="#" onClick={() => setMode('signup')} style={{ color: '#007bff' }}>Create account</a>
              </>
            )}
            {mode === 'signup' && <a href="#" onClick={() => setMode('signin')} style={{ color: '#007bff' }}>Have an account? Sign in</a>}
            {mode === 'forgot' && <a href="#" onClick={() => setMode('signin')} style={{ color: '#007bff' }}>Back to sign in</a>}
          </div>
        )}
      </div>
    </div>
  );
}
