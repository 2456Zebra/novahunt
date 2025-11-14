'use client';

import React, { useState, useEffect } from 'react';

/**
 * SignInModal — lightweight local account support for testing.
 * - Sign up stores a local test account in localStorage (no external auth).
 * - Sign in validates against the local account and shows success message.
 * - Does NOT auto-close; user stays on the modal after actions.
 *
 * Note: Replace with real auth when ready.
 */
export default function SignInModal({ open, onClose, initialMode = 'signin' }) {
  const [mode, setMode] = useState(initialMode); // signin | signup | forgot
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setMode(initialMode);
    setMessage('');
    setError('');
    setEmail('');
    setPassword('');
  }, [initialMode, open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !password) {
      setError('Email and password required');
      return;
    }

    try {
      if (mode === 'signup') {
        // store a simple local account for testing
        const accountsJSON = localStorage.getItem('nh_accounts') || '{}';
        const accounts = JSON.parse(accountsJSON);
        if (accounts[email]) {
          setError('An account with this email already exists. Sign in instead.');
          return;
        }
        accounts[email] = { password, created_at: new Date().toISOString() };
        localStorage.setItem('nh_accounts', JSON.stringify(accounts));
        setMessage('Account created locally. You can now sign in.');
      } else if (mode === 'signin') {
        const accountsJSON = localStorage.getItem('nh_accounts') || '{}';
        const accounts = JSON.parse(accountsJSON);
        const acct = accounts[email];
        if (!acct || acct.password !== password) {
          setError('Invalid email or password.');
          return;
        }
        setMessage(`Signed in as ${email}`);
      } else if (mode === 'forgot') {
        // no email sending; show instructions
        setMessage('If this were a production site, a password reset email would be sent. For now, sign up again or contact the owner.');
      }
    } catch (err) {
      setError(err?.message || 'Unknown error');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '92%', maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', fontSize: '1.25rem' }}>×</button>

        <h2 style={{ marginTop: 0 }}>{mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}</h2>

        {message && <p style={{ color: 'green' }}>{message}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '0.75rem', border: '1px solid #ccc', borderRadius: '8px' }} />
          {mode !== 'forgot' && <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '0.75rem', border: '1px solid #ccc', borderRadius: '8px' }} />}
          <button type="submit" style={{ background: '#111827', color: 'white', padding: '0.75rem', borderRadius: '8px', border: 'none' }}>
            {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create account' : 'Send Reset Link'}
          </button>
        </form>

        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
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
