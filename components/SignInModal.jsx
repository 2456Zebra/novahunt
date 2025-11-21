'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { signIn } from '../utils/auth';

/**
 * SignInModal now accepts a prefillEmail prop via Header's event detail,
 * and emits an 'nh-signed-in' event (in addition to account-usage-updated)
 * so components (like RevealButton) can auto-retry pending actions.
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
      // focus might be added later with a ref
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
      try { window.dispatchEvent(new Event('nh-signed-in')); } catch (e) {}
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
        <div style={{ marginTop: 10, fontSize: 13, color: '#666' }}>
          No account? <Link href="/signup"><a style={{ color: '#007bff', textDecoration: 'underline' }}>Create one</a></Link> or <Link href="/plans"><a style={{ color: '#007bff', textDecoration: 'underline' }}>view plans</a></Link>.
        </div>
      </div>
    </div>
  );
}
