'use client';

import React, { useState, useEffect } from 'react';

/**
 * SignInModal — stores a local test account in localStorage for testing,
 * creates a local session on signup/signin, and notifies the app of auth changes.
 *
 * Usage:
 *  <SignInModal open={open} onClose={() => setOpen(false)} />
 *
 * Behavior:
 * - Signup creates nh_accounts and immediately sets nh_session (signed-in).
 * - Signin validates and sets nh_session.
 * - Emits window.dispatchEvent(new CustomEvent('nh:auth-change', { detail: { email } }))
 * - Shows an explicit Back to dashboard button instead of auto-flashing/closing.
 */
export default function SignInModal({ open, onClose, initialMode = 'signin' }) {
  const [mode, setMode] = useState(initialMode); // signin | signup | forgot
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [justSignedIn, setJustSignedIn] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setMessage('');
    setError('');
    setEmail('');
    setPassword('');
    setJustSignedIn(false);
    setProcessing(false);
  }, [initialMode, open]);

  if (!open) return null;

  function setSession(email) {
    const session = { email, created_at: new Date().toISOString() };
    try {
      localStorage.setItem('nh_session', JSON.stringify(session));
      // notify other parts of the app
      window.dispatchEvent(new CustomEvent('nh:auth-change', { detail: { email } }));
    } catch (e) {
      console.warn('Could not set local session', e);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!email || !password) {
      setError('Email and password required');
      return;
    }
    setProcessing(true);
    try {
      if (mode === 'signup') {
        const accountsJSON = localStorage.getItem('nh_accounts') || '{}';
        const accounts = JSON.parse(accountsJSON);
        if (accounts[email]) {
          setError('An account with this email already exists. Sign in instead.');
          setProcessing(false);
          return;
        }
        accounts[email] = { password, created_at: new Date().toISOString() };
        localStorage.setItem('nh_accounts', JSON.stringify(accounts));
        // Immediately create session and mark signed in
        setSession(email);
        setMessage('Account created and signed in locally.');
        setJustSignedIn(true);
        setProcessing(false);
        return;
      } else if (mode === 'signin') {
        const accountsJSON = localStorage.getItem('nh_accounts') || '{}';
        const accounts = JSON.parse(accountsJSON);
        const acct = accounts[email];
        if (!acct || acct.password !== password) {
          setError('Invalid email or password.');
          setProcessing(false);
          return;
        }
        setSession(email);
        setMessage(`Signed in as ${email}`);
        setJustSignedIn(true);
        setProcessing(false);
        return;
      } else if (mode === 'forgot') {
        setMessage('If this were a production site, a password reset email would be sent. For now, sign up again or contact the owner.');
        setProcessing(false);
        return;
      }
    } catch (err) {
      setError(err?.message || 'Unknown error');
      setProcessing(false);
    }
  };

  // explicit back-to-dashboard action (keeps UX clear)
  function backToDashboard() {
    onClose?.();
    try {
      // navigate to root or /dashboard depending on your app
      window.location.href = '/';
    } catch (err) {
      // noop
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: 'white', padding: '1.25rem', borderRadius: '10px', width: '92%', maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', fontSize: '1.25rem' }}>×</button>

        <h2 style={{ marginTop: 0 }}>{mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}</h2>

        {message && <p style={{ color: 'green' }}>{message}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '0.6rem', border: '1px solid #ccc', borderRadius: '8px' }} />
          {mode !== 'forgot' && <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '0.6rem', border: '1px solid #ccc', borderRadius: '8px' }} />}
          <button type="submit" style={{ background: '#111827', color: 'white', padding: '0.6rem', borderRadius: '8px', border: 'none' }} disabled={processing}>
            {processing ? (mode === 'signup' ? 'Creating…' : 'Signing in…') : (mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create account' : 'Send Reset Link')}
          </button>
        </form>

        {justSignedIn && (
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button onClick={backToDashboard} style={{ background: '#059669', color: 'white', padding: '0.5rem 0.75rem', borderRadius: '8px', border: 'none' }}>
              Back to dashboard
            </button>
            <button onClick={onClose} style={{ background: '#e5e7eb', color: '#111827', padding: '0.5rem 0.75rem', borderRadius: '8px', border: 'none' }}>
              Stay here
            </button>
          </div>
        )}

        <div style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.9rem' }}>
          {mode === 'signin' && (
            <>
              Forgot password? <a href="#" onClick={() => setMode('forgot')} style={{ color: '#007bff' }}>Reset</a> • <a href="#" onClick={() => setMode('signup')} style={{ color: '#007bff' }}>Create account</a>
            </>
          )}
          {mode === 'signup' && <a href="#" onClick={() => setMode('signin')} style={{ color: '#007bff' }}>Have an account? Sign in</a>}
          {mode === 'forgot' && <a href="#" onClick={() => setMode('signin')} style={{ color: '#007bff' }}>Back to sign in</a>}
        </div>
      </div>
    </div>
  );
}
