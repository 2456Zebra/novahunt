'use client';

import { useEffect, useState } from 'react';
import { signIn } from '../utils/auth';
import Link from 'next/link';

/**
 * SignInModal — lightweight client-side modal to sign users in inline.
 * Opens when parent sets open={true}. On success dispatches `account-usage-updated`.
 * If props.prefillEmail provided, prefill the email field (used for retry-after-signin).
 */
export default function SignInModal({ open, onClose, prefillEmail = '' }) {
  const [email, setEmail] = useState(prefillEmail || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) {
      setEmail(prefillEmail || '');
      setPassword('');
      setErr('');
    }
  }, [open, prefillEmail]);

  if (!open) return null;

  async function submit(e) {
    e && e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await signIn({ email, password });
      try { window.dispatchEvent(new Event('account-usage-updated')); } catch (e) {}
      onClose && onClose();
    } catch (er) {
      setErr(er?.message || 'Signin failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{ width: 420, maxWidth: '94%', background: '#fff', padding: 20, borderRadius: 8 }}>
        <h3 style={{ marginTop: 0 }}>Sign in to reveal full emails</h3>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input required type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} style={{ padding: '10px', borderRadius: 6, border: '1px solid #ddd' }} />
          <input required type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} style={{ padding: '10px', borderRadius: 6, border: '1px solid #ddd' }} />
          {err && <div style={{ color: 'crimson' }}>{err}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: 10, background: '#f97316', color: '#fff', border: 'none', borderRadius: 6 }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <button type="button" onClick={() => onClose && onClose()} style={{ padding: 10, borderRadius: 6 }}>
              Cancel
            </button>
          </div>
        </form>

        <div style={{ marginTop: 12, fontSize: 13, color: '#666' }}>
          No account? <a href="/signup" style={{ color: '#007bff', textDecoration: 'underline' }}>Create one</a> or <a href="/upgrade" style={{ color: '#007bff', textDecoration: 'underline' }}>view plans</a>.
        </div>
      </div>
    </div>
  );
}
