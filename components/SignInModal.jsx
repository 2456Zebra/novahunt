import React, { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * SignInModal — renders only when `open` is true. Accepts:
 *  - open (boolean)
 *  - onClose (function)
 *  - prefillEmail (string)
 *
 * This modal intentionally removes an internal "Sign up" CTA (Sign up -> Plans).
 */
export default function SignInModal({ open = false, onClose = () => {}, prefillEmail = '' }) {
  const [email, setEmail] = useState(prefillEmail || '');

  useEffect(() => {
    setEmail(prefillEmail || '');
  }, [prefillEmail]);

  // Do not render when closed
  if (!open) return null;

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
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.4)'
        }}
      />

      {/* Modal */}
      <div
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
          <h2 style={{ margin: 0 }}>Sign in</h2>
          <button onClick={onClose} aria-label="Close" style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer' }}>
            ×
          </button>
        </header>

        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'block', marginBottom: 8, color: '#374151' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #e5e7eb' }}
          />

          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button style={{ padding: '8px 12px', background: '#111827', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              Continue
            </button>
            <button onClick={onClose} style={{ padding: '8px 12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>

          <div style={{ marginTop: 16, color: '#6b7280' }}>
            <p style={{ margin: '6px 0' }}>
              Learn about plans:{' '}
              <Link href="/plans/">
                <a>Plans</a>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
