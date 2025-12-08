import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import Footer from '../components/Footer';
import LimitModal from '../components/LimitModal';
import ErrorBoundary from '../components/ErrorBoundary';
import { getClientEmail, getClientUsage, clearClientSignedIn } from '../lib/auth-client';
import Router from 'next/router';
import GlobalRevealInterceptor from '../components/GlobalRevealInterceptor';

/**
 * Restored global app wrapper (your proven working code) with two tiny, safe additions:
 *  - Renders GlobalRevealInterceptor for signed-in users so Reveal clicks are handled inline.
 *  - Injects a tiny style to hide Sign Up links when signed-in.
 *
 * This mirrors the working snippet you provided.
 */

function Progress({ value = 0, max = 1 }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / Math.max(1, max)) * 100)));
  return (
    <div style={{ width: 200 }}>
      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#60a5fa' }} />
      </div>
      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>{value}/{max}</div>
    </div>
  );
}

function AccountMenu({ email }) {
  const [open, setOpen] = useState(false);
  const [usage, setUsage] = useState(getClientUsage());
  const ref = useRef(null);

  useEffect(() => {
    function docClick(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    window.addEventListener('click', docClick);

    function readUsage() {
      try {
        const u = getClientUsage();
        setUsage(u);
      } catch (e) {}
    }

    window.addEventListener('storage', readUsage);
    window.addEventListener('nh_usage_updated', readUsage);
    window.addEventListener('nh_auth_changed', readUsage);

    // initial read
    readUsage();

    return () => {
      window.removeEventListener('click', docClick);
      window.removeEventListener('storage', readUsage);
      window.removeEventListener('nh_usage_updated', readUsage);
      window.removeEventListener('nh_auth_changed', readUsage);
    };
  }, []);

  function handleSignOut() {
    try { clearClientSignedIn(); } catch (e) { /* ignore */ }
    setOpen(false);
    try { Router.push('/'); } catch (e) { window.location.href = '/'; }
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ fontSize: 13, color: '#374151' }}>
          <strong style={{ fontWeight: 700 }}>{usage?.searches ?? 0}/{usage?.limitSearches ?? 0}</strong> Searches &nbsp;•&nbsp;
          <strong style={{ fontWeight: 700 }}>{usage?.reveals ?? 0}/{usage?.limitReveals ?? 0}</strong> Reveals
        </div>

        <button onClick={() => setOpen(v => !v)} aria-haspopup="true" aria-expanded={open} style={{
          display: 'flex', gap: 8, alignItems: 'center', padding: '8px 10px', borderRadius: 8, border: '1px solid #e6edf3', background: '#fff', cursor: 'pointer', fontSize: 13
        }}>
          <span style={{ fontWeight: 600 }}>{email}</span>
          <span style={{ color: '#6b7280', fontSize: 12 }}>{open ? '▴' : '▾'}</span>
        </button>
      </div>

      {open ? (
        <div style={{
          position: 'absolute',
          right: 0,
          marginTop: 8,
          minWidth: 300,
          background: '#fff',
          border: '1px solid #e6edf3',
          borderRadius: 8,
          boxShadow: '0 8px 30px rgba(11,18,32,0.08)',
          zIndex: 120
        }}>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Usage blocks */}
            <div>
              <div style={{ fontSize: 13, color: '#374151', marginBottom: 6 }}>Searches</div>
              <Progress value={usage?.searches ?? 0} max={usage?.limitSearches ?? 1} />
            </div>

            <div>
              <div style={{ fontSize: 13, color: '#374151', marginBottom: 6 }}>Reveals</div>
              <Progress value={usage?.reveals ?? 0} max={usage?.limitReveals ?? 1} />
            </div>

            {/* Links */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <a href="/billing" style={{ flex: 1, padding: '8px 10px', borderRadius: 6, background: '#f3f4f6', textAlign: 'center', color: '#0b1220', textDecoration: 'none' }}>Billing</a>
              <a href="/account" style={{ flex: 1, padding: '8px 10px', borderRadius: 6, background: '#fff', border: '1px solid #e6edf3', textAlign: 'center', color: '#0b1220', textDecoration: 'none' }}>Account</a>
            </div>

            {/* Side-by-side action buttons (equal width) */}
            <div style={{ display: 'flex', gap: 8 }}>
              <a href="/account" style={{ flex: 1, padding: '8px 10px', borderRadius: 6, background: '#ffffff', border: '1px solid #e6edf3', textAlign: 'center', color: '#0b1220', textDecoration: 'none' }}>Manage</a>
              <button onClick={handleSignOut} style={{ flex: 1, padding: '8px 10px', borderRadius: 6, background: '#0ea5e9', border: 'none', color: '#fff', cursor: 'pointer' }}>Sign out</button>
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

    const readEmail = () => {
      try {
        const e = getClientEmail();
        setEmail(e || null);
      } catch (err) { setEmail(null); }
    };

    readEmail();

    function onStore(e) {
      if (!e) return;
      if (['nh_user_email', 'nh_usage', 'nh_usage_last_update'].includes(e.key)) readEmail();
    }
    const onAuth = () => readEmail();

    window.addEventListener('storage', onStore);
    window.addEventListener('nh_auth_changed', onAuth);

    return () => {
      window.removeEventListener('storage', onStore);
      window.removeEventListener('nh_auth_changed', onAuth);
    };
  }, []);

  // Hide Sign Up links when signed in (small injection; safe)
  useEffect(() => {
    const STYLE_ID = 'nova-hide-auth-links';
    const css = `
      a[href="/signup"], a[href*="signup"], a[href="/register"], a[href*="register"], .nav-signup {
        display: none !important;
      }
    `;
    if (mounted && email) {
      if (!document.getElementById(STYLE_ID)) {
        const s = document.createElement('style');
        s.id = STYLE_ID;
        s.appendChild(document.createTextNode(css));
        document.head.appendChild(s);
      }
    } else {
      const existing = document.getElementById('nova-hide-auth-links');
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    }
    return () => {
      const existing = document.getElementById('nova-hide-auth-links');
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    };
  }, [mounted, email]);

  return (
    <>
      <Head><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>

      {/* Only show compact signed-in bar; anonymous users see no header */}
      {mounted && email ? (
        <div style={{ width: '100%', padding: '10px 16px', boxSizing: 'border-box', background: '#fff', borderBottom: '1px solid rgba(14,20,24,0.04)', position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <AccountMenu email={email} />
          </div>
        </div>
      ) : null}

      {/* Global interceptor restored for inline reveals */}
      {mounted && email && typeof window !== 'undefined' && <GlobalRevealInterceptor />}

      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>

      <Footer />

      <LimitModal />
    </>
  );
}
