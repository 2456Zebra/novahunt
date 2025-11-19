'use client';

import Link from 'next/link';
import HeaderAuth from './HeaderAuth';
import { useEffect, useState } from 'react';
import SignInModal from './SignInModal';

/**
 * Header listens for open-signin-modal events and forwards prefillEmail (if provided)
 * in the event detail down to SignInModal.
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
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #e6e6e6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/">
            <a style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <img src="/logo.svg" alt="NovaHunt" style={{ height: 28 }} onError={(e)=>{ e.currentTarget.src='/favicon.svg'; }} />
              <strong style={{ color: '#111' }}>NovaHunt</strong>
            </a>
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <HeaderAuth />
        </div>
      </header>

      <SignInModal open={showSignIn} onClose={() => setShowSignIn(false)} prefillEmail={prefillEmail} />
    </>
  );
}
