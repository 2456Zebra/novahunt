'use client';

import Link from 'next/link';
import HeaderAuth from './HeaderAuth';
import { useEffect, useState } from 'react';
import SignInModal from './SignInModal';

/**
 * Neutral header: use simple text logo with smaller accent color (less teal).
 * If you have an older logo, upload public/logo-old.svg and switch the img src accordingly.
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/">
            <a style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#111' }}>
              {/* Prefer using a neutral monochrome logo or plain text */}
              <img src="/logo.svg" alt="NovaHunt" style={{ height: 28, filter: 'grayscale(20%)' }} onError={(e)=>{ e.currentTarget.src='/favicon.svg'; }} />
              <strong style={{ color: '#111', fontWeight: 800, letterSpacing: '-0.2px' }}>NovaHunt</strong>
            </a>
          </Link>
          <nav>
            <Link href="/"><a style={{ marginLeft: 12, color: '#374151', textDecoration: 'none' }}>Home</a></Link>
            <Link href="/plans"><a style={{ marginLeft: 12, color: '#374151', textDecoration: 'none' }}>Plans</a></Link>
            <Link href="/about"><a style={{ marginLeft: 12, color: '#374151', textDecoration: 'none' }}>About</a></Link>
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
