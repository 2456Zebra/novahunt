'use client';

import React, { useEffect, useState } from 'react';
import SignInModal from '../SignInModal'; // ensure this path matches where SignInModal.jsx is located

export default function Header() {
  const [userEmail, setUserEmail] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('signin');

  useEffect(() => {
    // on mount, read session from localStorage
    try {
      const s = localStorage.getItem('nh_session');
      if (s) {
        const parsed = JSON.parse(s);
        setUserEmail(parsed?.email || null);
      }
    } catch (e) {
      // ignore
    }

    function onAuth(e) {
      const email = e?.detail?.email;
      setUserEmail(email || null);
    }
    function onOpenAuth(e) {
      setModalMode((e?.detail?.mode) || 'signin');
      setModalOpen(true);
    }

    window.addEventListener('nh:auth-change', onAuth);
    window.addEventListener('nh:open-auth', onOpenAuth);
    return () => {
      window.removeEventListener('nh:auth-change', onAuth);
      window.removeEventListener('nh:open-auth', onOpenAuth);
    };
  }, []);

  function openSignIn(mode = 'signin') {
    setModalMode(mode);
    setModalOpen(true);
  }

  function handleSignOut() {
    try {
      localStorage.removeItem('nh_session');
      window.dispatchEvent(new CustomEvent('nh:auth-change', { detail: { email: null } }));
      setUserEmail(null);
      window.location.href = '/';
    } catch (err) {
      console.warn(err);
    }
  }

  return (
    <>
      <header style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, display: 'flex', gap: 8, alignItems: 'center' }}>
          <div>NovaHunt</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>powered by AI</div>
        </div>

        <div>
          {userEmail ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: '#111827' }}>{userEmail}</span>
              <button onClick={handleSignOut} style={{ background: 'transparent', border: '1px solid #e5e7eb', padding: '6px 10px', borderRadius: 8 }}>Sign out</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => openSignIn('signin')} style={{ background: 'transparent', border: 'none', color: '#111827', cursor: 'pointer' }}>Sign in</button>
              <button onClick={() => openSignIn('signup')} style={{ background: '#111827', color: 'white', padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>Sign up</button>
            </div>
          )}
        </div>
      </header>

      <SignInModal open={modalOpen} onClose={() => setModalOpen(false)} initialMode={modalMode} />
    </>
  );
}
