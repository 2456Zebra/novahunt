'use client';

import Link from 'next/link';
import HeaderAuth from './HeaderAuth';
import { useEffect, useState } from 'react';
import SignInModal from './SignInModal';

/**
 * Simple text-only header: show a bold NovaHunt wordmark (no logo image).
 * Keeps the same nav and auth area.
 */

export default function Header() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [prefillEmail, setPrefillEmail] = useState('');

  useEffect(() => {
    function onOpen(e) {
      const detail = e && e.detail;
      const pref = detail && detail.prefillEmail ? String(detail.prefillEmail) : '';
      setPrefillEmail(pref || (window.__nh_prefill_email || ''));
      setShowSignIn(true);
    }
    window.addEventListener('open-signin-modal', onOpen);
    return () => window.removeEventListener('open-signin-modal', onOpen);
  }, []);

  return (
    <>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #e6e6e6', background: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/">
            <a aria-label="NovaHunt home" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#111' }}>
              {/* Text-only wordmark */}
              <span style={{ fontSize: 20, fontWeight: 800, color: '#111', letterSpacing: '-0.2px' }}>NovaHunt</span>
            </a>
          </Link>

          <nav style={{ display: 'flex', gap: 12 }}>
            <Link href="/"><a style={{ color: '#374151', textDecoration: 'none' }}>Home</a></Link>
            <Link href="/plans/"><a style={{ color: '#374151', textDecoration: 'none' }}>Plans</a></Link>
            <Link href="/about/"><a style={{ color: '#374151', textDecoration: 'none' }}>About</a></Link>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <HeaderAuth />
        </div>
      </header>

      <SignInModal open={showSignIn} onClose={() => setShowSignIn(false)} prefillEmail={prefillEmail} />
    </>
  );
}
