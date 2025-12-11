import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Router from 'next/router';
import { setClientSignedIn } from '../lib/auth-client';

/**
 * SignInModal — renders only when `open` is true.
 *
 * Updated behavior:
 * - "Create account" takes users to /plans (so they can select a plan) per product request.
 * - After successful signup/signin we persist usage (using server-provided usage when available),
 *   and we ensure plan defaults are applied client-side (lib/auth-client does that).
 */
export default function SignInModal({ open = false, onClose = () => {}, prefillEmail = '' }) {
  const [email, setEmail] = useState(prefillEmail || '');
  const [password, setPassword] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [justSignedIn, setJustSignedIn] = useState(false);

  useEffect(() => {
    setEmail(prefillEmail || '');
  }, [prefillEmail]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setProcessing(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'signup') {
        const res = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: String(email || '').trim(), password, plan: 'free' }),
        });
        const body = await res.json();
        if (!res.ok) {
          setError(body?.error || 'Could not create account.');
          setProcessing(false);
          return;
        }
        // server may return usage shape; lib/auth-client will normalize + apply plan defaults
        const usage = body?.usage || { plan: 'free', searches: 0, reveals: 0, limitSearches: 5, limitReveals: 3 };
        setClientSignedIn(email, usage);
        setJustSignedIn(true);
        setProcessing(false);
        Router.push('/');
        return;
      }

      if (mode === 'signin') {
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
        const usage = body?.usage || { plan: 'free', searches: 0, reveals: 0, limitSearches: 5, limitReveals: 3 };
        setClientSignedIn(email, usage);
        setJustSignedIn(true);
        setProcessing(false);
        Router.push('/');
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
    Router.push('/');
  }

  return (
    <div
      aria-modal="true"
      role="dialog"
      aria-label="Sign in"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1200,
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.4)'
        }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 'min(720px, 96%)',
          maxWidth: 720,
          background: '#fff',
          borderRadius: 8,
          padding: 20,
          boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
          zIndex: 1201
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>{mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create Account' : 'Reset password'}</h2>
          <button onClick={onClose} aria-label="Close" style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer' }}>
            ×
          </button>
        </header>

        <div style={{ marginTop: 12 }}>
          {message && <p style={{ color: 'green' }}>{message}</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}

          {!justSignedIn && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ display: 'block', marginBottom: 8, color: '#374151' }}>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #e5e7eb' }}
              />
              {mode !== 'forgot' && (
                <>
                  <label style={{ display: 'block', marginBottom: 8, color: '#374151' }}>Password</label>
                  <input
                    type="password"
                    placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #e5e7eb' }}
                  />
                </>
              )}

              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button style={{ padding: '8px 12px', background: '#111827', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                  {processing ? 'Working…' : mode === 'signin' ? 'Continue' : 'Create account'}
                </button>
                <button onClick={onClose} type="button" style={{ padding: '8px 12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {justSignedIn && (
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button onClick={backToDashboard} style={{ background: '#059669', color: 'white', padding: '0.5rem 0.75rem', borderRadius: '8px', border: 'none' }}>
                Back to dashboard
              </button>
            </div>
          )}

          {!justSignedIn && (
            <div style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.9rem' }}>
              {mode === 'signin' && (
                <>
                  Forgot password? <a href="#" onClick={() => setMode('forgot')} style={{ color: '#007bff' }}>Reset</a> •{' '}
                  <a href="#" onClick={() => { /* product requirement: take users to Plans to choose plan and create account */ Router.push('/plans'); }} style={{ color: '#007bff' }}>
                    Create account
                  </a>
                </>
              )}
              {mode === 'signup' && <a href="#" onClick={() => setMode('signin')} style={{ color: '#007bff' }}>Have an account? Sign in</a>}
              {mode === 'forgot' && <a href="#" onClick={() => setMode('signin')} style={{ color: '#007bff' }}>Back to sign in</a>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
