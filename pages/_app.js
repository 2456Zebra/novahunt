import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import Footer from '../components/Footer';
import LimitModal from '../components/LimitModal';
import ErrorBoundary from '../components/ErrorBoundary';
import { getClientEmail, getClientUsage, clearClientSignedIn } from '../lib/auth-client';
import Router from 'next/router';

/*
 Minimal signed-in account bar with usage display.
 - No header for anonymous users.
 - When signed in: show usage "searchesUsed/limitSearches Searches • revealsUsed/limitReveals Reveals"
 - Account pulldown includes Account, Billing and side-by-side Account / Sign out buttons.
*/

function AccountMenu({ email }) {
  const [open, setOpen] = useState(false);
  const [usage, setUsage] = useState(getClientUsage() || { searches: 0, limitSearches: 0, reveals: 0, limitReveals: 0 });
  const ref = useRef(null);

  useEffect(() => {
    function handleDocClick(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    window.addEventListener('click', handleDocClick);

    function readUsage() {
      try {
        const u = getClientUsage() || { searches: 0, limitSearches: 0, reveals: 0, limitReveals: 0 };
        setUsage(u);
      } catch (e) {}
    }

    window.addEventListener('storage', readUsage);
    window.addEventListener('nh_usage_updated', readUsage);
    window.addEventListener('nh_auth_changed', readUsage);

    // initial read
    readUsage();

    return () => {
      window.removeEventListener('click', handleDocClick);
      window.removeEventListener('storage', readUsage);
      window.removeEventListener('nh_usage_updated', readUsage);
      window.removeEventListener('nh_auth_changed', readUsage);
    };
  }, []);

  function handleSignOut() {
    try {
      clearClientSignedIn();
    } catch (e) { /* ignore */ }
    setOpen(false);
    try { Router.push('/'); } catch (e) { window.location.href = '/'; }
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 13, color: '#374151' }}>
          <span style={{ fontWeight: 700 }}>{usage.searches}/{usage.limitSearches}</span> Searches&nbsp;•&nbsp;
          <span style={{ fontWeight: 700 }}>{usage.reveals}/{usage.limitReveals}</span> Reveals
        </div>

        <button
          onClick={() => setOpen(v => !v)}
          aria-haspopup="true"
          aria-expanded={open}
          style={{
            display: 'flex',
            gap: 8,
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
      </div>

      {open ? (
        <div style={{
          position: 'absolute',
          right: 0,
          marginTop: 8,
          minWidth: 220,
          background: '#fff',
          border: '1px solid #e6edf3',
          borderRadius: 8,
          boxShadow: '0 8px 30px rgba(11,18,32,0.08)',
          zIndex: 120
        }}>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <a href="/account" style={{ padding: '8px 10px', borderRadius: 6, color: '#0b1220', textDecoration: 'none' }}>Account</a>
            <a href="/billing" style={{ padding: '8px 10px', borderRadius: 6, color: '#0b1220', textDecoration: 'none' }}>Billing</a>

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <a href="/account" style={{ flex: 1, padding: '8px 10px', borderRadius: 6, background: '#f3f4f6', textAlign: 'center', color: '#0b1220', textDecoration: 'none' }}>Account</a>
              <button onClick={handleSignOut} style={{ flex: 1, padding: '8px 10px', borderRadius: 6, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer' }}>Sign out</button>
            </div>
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

    readEmail();

    function onStorage(e) {
      if (!e) return;
      if (['nh_user_email', 'nh_usage', 'nh_usage_last_update'].includes(e.key)) {
        readEmail();
      }
    }
    const onAuthChanged = () => readEmail();

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

      {/* Only show compact signed-in bar; anonymous users see no header */}
      {mounted && email ? (
        <div style={{
          width: '100%',
          padding: '10px 16px',
          boxSizing: 'border-box',
          background: '#fff',
          borderBottom: '1px solid rgba(14,20,24,0.04)',
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
