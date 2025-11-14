'use client';

import React, { useEffect, useState } from 'react';

export default function Header() {
  const [userEmail, setUserEmail] = useState(null);

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

    // listen for auth changes from the modal
    function onAuth(e) {
      const email = e?.detail?.email;
      setUserEmail(email || null);
    }
    window.addEventListener('nh:auth-change', onAuth);
    return () => window.removeEventListener('nh:auth-change', onAuth);
  }, []);

  function handleSignOut() {
    try {
      localStorage.removeItem('nh_session');
      window.dispatchEvent(new CustomEvent('nh:auth-change', { detail: { email: null } }));
      setUserEmail(null);
      // redirect to home
      window.location.href = '/';
    } catch (err) {
      console.warn(err);
    }
  }

  return (
    <header style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontWeight: 700 }}>NovaHunt<span style={{ marginLeft: 8, fontSize: 12, color: '#6b7280' }}>powered by AI</span></div>
      <div>
        {userEmail ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: '#111827' }}>{userEmail}</span>
            <button onClick={handleSignOut} style={{ background: 'transparent', border: '1px solid #e5e7eb', padding: '6px 10px', borderRadius: 8 }}>Sign out</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <a href="#" id="signin-link" style={{ color: '#111827', marginRight: 8 }}>Sign in</a>
            <a href="#" id="signup-link" style={{ background: '#111827', color: 'white', padding: '6px 10px', borderRadius: 8, textDecoration: 'none' }}>Sign up</a>
          </div>
        )}
      </div>
    </header>
  );
}
