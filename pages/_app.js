import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import Footer from '../components/Footer';
import LimitModal from '../components/LimitModal';
import ErrorBoundary from '../components/ErrorBoundary';
import { getClientEmail, clearClientSignedIn } from '../lib/auth-client';
import Router from 'next/router';

/*
  pages/_app.js — minimal signed-in account pulldown
  - No header is shown for anonymous users (ever).
  - When signed in (nh_user_email exists) a compact top bar is shown
    with the account email and a small pulldown menu on the right.
  - Global Footer and LimitModal remain rendered.
*/

function AccountMenu({ email }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    window.addEventListener('click', onDocClick);
    return () => window.removeEventListener('click', onDocClick);
  }, []);

  function handleSignOut() {
    try {
      clearClientSignedIn();
    } catch (e) {
      console.warn('sign out failed', e);
    } finally {
      setOpen(false);
      // navigate to home after sign out
      try { Router.push('/'); } catch (e) {}
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          padding: '8px 10px',
          borderRadius: 8,
          border: '1px solid #e6edf3',
          background: '#fff',
          cursor: 'pointer',
          fontSize: 13
        }}
      >
        <span style={{ fontWeight: 600, color: '#0b1220' }}>{email}</span>
        <span style={{ color: '#6b7280', fontSize: 12 }}>{open ? '▴' : '▾'}</span>
      </button>

      {open ? (
        <div style={{
          position: 'absolute',
          right: 0,
          marginTop: 8,
          minWidth: 180,
          background: '#fff',
          border: '1px solid #e6edf3',
          borderRadius: 8,
          boxShadow: '0 8px 30px rgba(11,18,32,0.08)',
          zIndex: 120
        }}>
          <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <a href="/account" style={{ padding: '8px 10px', borderRadius: 6, color: '#0b1220', textDecoration: 'none' }}>Account</a>
            <a href="/billing" style={{ padding: '8px 10px', borderRadius: 6, color: '#0b1220', textDecoration: 'none' }}>Billing</a>
            <button onClick={handleSignOut} style={{ padding: '8px 10px', borderRadius: 6, border: 'none', background: '#fff', textAlign: 'left', cursor: 'pointer', color: '#dc2626' }}>
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function MyApp({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setMounted(true);

    function readEmail() {
      try {
        const e = getClientEmail();
        setEmail(e || null);
      } catch (err) {
        setEmail(null);
      }
    }

    // initial read
    readEmail();

    // keep in sync with storage events and custom auth events
    function onStorage(e) {
      if (!e) return;
      if (['nh_user_email', 'nh_usage', 'nh_usage_last_update'].includes(e.key)) {
        readEmail();
      }
    }
    function onAuthChanged() { readEmail(); }

    window.addEventListener('storage', onStorage);
    window.addEventListener('nh_auth_changed', onAuthChanged);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('nh_auth_changed', onAuthChanged);
    };
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Only render the compact account bar when the app is mounted and user is signed in.
          Anonymous visitors will see no header/toolbar at the top. */}
      {mounted && email ? (
        <div style={{
          width: '100%',
          padding: '10px 16px',
          boxSizing: 'border-box',
          background: '#fff',
          borderBottom: '1px solid rgba(14, 20, 24, 0.04)',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <AccountMenu email={email} />
          </div>
        </div>
      ) : null}

      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>

      <Footer />

      <LimitModal />
    </>
  );
}
