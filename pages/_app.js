import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Footer from '../components/Footer';
import LimitModal from '../components/LimitModal';
import ErrorBoundary from '../components/ErrorBoundary';
import { getClientEmail, getClientUsage, clearClientSignedIn } from '../lib/auth-client';
import Router from 'next/router';
import GlobalRevealInterceptor from '../components/GlobalRevealInterceptor';

/**
 * Improved _app.js
 *
 * Fixes and behaviors:
 * - After /api/me confirms authenticated, fetch /api/session-info and normalize nh_usage.
 *   Polls /api/session-info a few times on mount if server still reporting free values so the header updates quickly
 *   after a plan change.
 * - Sign out:
 *   - Attempts server signout endpoints.
 *   - Clears local storage and local session state immediately so the header is hidden for the user.
 *   - Attempts to delete common auth cookies (best-effort).
 *   - Polls /api/me a few times and logs/alerts if server session remains active (helps debugging).
 *   - Even if server doesn't clear the session, local UI is cleared so you are effectively signed out on the client.
 * - Emits nh_usage_updated and nh_auth_changed appropriately.
 */

function normalizeUsage(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const out = {};
  out.searches = obj.searches ?? obj.usedSearches ?? obj.search_count ?? obj.searches_used ?? obj.searchesCount ?? 0;
  out.reveals = obj.reveals ?? obj.usedReveals ?? obj.reveal_count ?? obj.reveals_used ?? 0;
  out.limitSearches = obj.limitSearches ?? obj.maxSearches ?? obj.quotaSearches ?? obj.search_limit ?? obj.limit_searches ?? 0;
  out.limitReveals = obj.limitReveals ?? obj.maxReveals ?? obj.quotaReveals ?? obj.reveal_limit ?? obj.limit_reveals ?? 0;
  out.plan = obj.plan ?? obj.tier ?? obj.product ?? null;

  if (!out.searches && obj.usage && typeof obj.usage === 'object') {
    return normalizeUsage(obj.usage);
  }
  if (!out.searches && obj.searches && typeof obj.searches === 'object') {
    out.searches = obj.searches.used ?? obj.searches.value ?? out.searches;
    out.limitSearches = obj.searches.limit ?? obj.searches.max ?? out.limitSearches;
  }
  if (!out.reveals && obj.reveals && typeof obj.reveals === 'object') {
    out.reveals = obj.reveals.used ?? obj.reveals.value ?? out.reveals;
    out.limitReveals = obj.reveals.limit ?? obj.reveals.max ?? out.limitReveals;
  }
  ['searches','reveals','limitSearches','limitReveals'].forEach(k => { out[k] = Number(out[k] ?? 0) || 0; });
  return out;
}

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
  const ref = React.useRef(null);

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

    readUsage();

    return () => {
      window.removeEventListener('click', docClick);
      window.removeEventListener('storage', readUsage);
      window.removeEventListener('nh_usage_updated', readUsage);
      window.removeEventListener('nh_auth_changed', readUsage);
    };
  }, []);

  async function handleSignOut() {
    // Try several server endpoints (best-effort)
    try {
      const endpoints = ['/api/auth/signout', '/api/signout', '/api/auth/sign-out', '/api/auth/logout'];
      for (const url of endpoints) {
        try {
          await fetch(url, { method: 'POST', credentials: 'same-origin' });
        } catch (e) { /* ignore */ }
      }
    } catch (e) {
      console.error('signout server attempts failed', e);
    }

    // Clear local session state immediately so UI updates for the user
    try { clearClientSignedIn(); } catch (e) {}
    try {
      localStorage.removeItem('nh_user_email');
      localStorage.removeItem('nh_usage');
      localStorage.removeItem('nh_saved_contacts_last_update');
      localStorage.removeItem('nh_saved_contacts');
      localStorage.removeItem('nh_usage_last_update');
      localStorage.removeItem('nh_last_domain');
    } catch (e) {}

    // Best-effort cookie deletion for common cookie names
    try {
      const cookieNames = ['sb:token', 'session', 'session_token', 'supabase-auth-token', 'auth'];
      cookieNames.forEach(name => {
        try {
          document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure`;
          document.cookie = `${name}=; Path=/; Domain=${window.location.hostname}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure`;
        } catch (e) {}
      });
    } catch (e) {}

    // Hide header locally
    setOpen(false);
    try { window.dispatchEvent(new Event('nh_auth_changed')); } catch (e) {}

    // Poll server /api/me a few times; if still authenticated we log and alert (for debugging)
    try {
      let serverStillAuth = false;
      for (let i = 0; i < 5; i++) {
        try {
          const r = await fetch('/api/me', { credentials: 'same-origin' });
          if (!r.ok) { serverStillAuth = false; break; }
          const txt = await r.text().catch(()=>null);
          if (!txt) { serverStillAuth = false; break; }
          try {
            const body = JSON.parse(txt);
            if (!body || !body.authenticated) { serverStillAuth = false; break; }
            serverStillAuth = true;
          } catch (e) {
            serverStillAuth = false;
            break;
          }
        } catch (e) {
          serverStillAuth = false;
          break;
        }
        await new Promise(res => setTimeout(res, 300));
      }
      // If server still thinks you're signed in, inform user but keep client cleared
      if (serverStillAuth) {
        try { alert('Sign out attempted but server session still appears active. Please try a hard refresh or clear cookies. If problem persists contact support.'); } catch (e) {}
        console.warn('Client cleared session but server still reports authenticated after signout attempts.');
      }
    } catch (e) {
      console.error('signout verification failed', e);
    }

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
          display: 'flex', gap: 8, alignItems: 'center', padding: '6px 8px', borderRadius: 8, border: '1px solid #e6edf3', background: '#fff', cursor: 'pointer', fontSize: 12
        }}>
          <span style={{ fontWeight: 700 }}>{email}</span>
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
          <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <div style={{ fontSize: 13, color: '#374151', marginBottom: 6 }}>Searches</div>
              <Progress value={usage?.searches ?? 0} max={usage?.limitSearches ?? 1} />
            </div>

            <div>
              <div style={{ fontSize: 13, color: '#374151', marginBottom: 6 }}>Reveals</div>
              <Progress value={usage?.reveals ?? 0} max={usage?.limitReveals ?? 1} />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <a
                href="/account"
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: 6,
                  background: '#ffffff',
                  border: '1px solid #e6edf3',
                  textAlign: 'center',
                  color: '#0b1220',
                  textDecoration: 'none',
                  fontWeight: 700,
                  minHeight: 32,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                Account
              </a>

              <button
                onClick={handleSignOut}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: 6,
                  background: '#0ea5e9',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 700,
                  minHeight: 32,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                Sign out
              </button>
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

    let mountedFlag = true;

    async function readAuthAndSession() {
      try {
        const res = await fetch('/api/me', { credentials: 'same-origin' });
        if (res.ok) {
          const body = await res.json().catch(() => null);
          if (body && body.authenticated) {
            const e = (body.user && (body.user.email || body.user.id)) || body.email || null;
            if (e) {
              setEmail(e);
              try { localStorage.setItem('nh_user_email', e); } catch (err) {}

              // fetch session-info and normalize usage
              try {
                const sess = await fetch('/api/session-info', { credentials: 'same-origin' });
                if (sess && sess.ok) {
                  const sessBody = await sess.json().catch(() => null);
                  const normalized = normalizeUsage(sessBody);
                  if (normalized) {
                    try {
                      localStorage.setItem('nh_usage', JSON.stringify(normalized));
                      try { window.dispatchEvent(new CustomEvent('nh_usage_updated')); } catch (e) {}
                    } catch (e) {}
                  }
                }
              } catch (e) {
                console.error('session-info fetch error', e);
              }

              // If the server returns free limits but user likely just upgraded, poll session-info a few times
              // to pick up the new plan quickly (helps race between webhook and client redirect).
              const pollAttempts = 6;
              for (let i = 0; i < pollAttempts; i++) {
                try {
                  const sess2 = await fetch('/api/session-info', { credentials: 'same-origin' });
                  if (sess2 && sess2.ok) {
                    const sbody = await sess2.json().catch(()=>null);
                    const normalized2 = normalizeUsage(sbody);
                    if (normalized2 && (normalized2.limitSearches > 0 || normalized2.plan)) {
                      try {
                        localStorage.setItem('nh_usage', JSON.stringify(normalized2));
                        try { window.dispatchEvent(new CustomEvent('nh_usage_updated')); } catch (e) {}
                        break;
                      } catch (e) {}
                    }
                  }
                } catch (e) {}
                await new Promise(res => setTimeout(res, 500));
              }

              try { window.dispatchEvent(new Event('nh_auth_changed')); } catch (err) {}
              return;
            }
          }
        }
      } catch (err) {
        console.error('readAuth /api/me error', err);
      }

      // fallback to client-side stored email if available
      try {
        const clientE = getClientEmail();
        if (clientE) {
          setEmail(clientE);
          try { localStorage.setItem('nh_user_email', clientE); } catch (err) {}
          try { window.dispatchEvent(new Event('nh_auth_changed')); } catch (err) {}
          return;
        }
      } catch (e) {}

      // not authenticated
      try { localStorage.removeItem('nh_user_email'); } catch (e) {}
      setEmail(null);
      try { window.dispatchEvent(new Event('nh_auth_changed')); } catch (err) {}
    }

    readAuthAndSession();

    function onStore(e) {
      if (!e) return;
      if (['nh_user_email', 'nh_usage', 'nh_usage_last_update', 'nh_saved_contacts_last_update'].includes(e.key)) {
        try {
          const v = localStorage.getItem('nh_user_email');
          setEmail(v || null);
        } catch (err) {}
      }
    }

    window.addEventListener('storage', onStore);
    return () => {
      mountedFlag = false;
      window.removeEventListener('storage', onStore);
    };
  }, []);

  // small helper css for opt-in bold homepage link
  useEffect(() => {
    const STYLE_ID = 'nova-small-fixes';
    const css = `
      .go-home-button { font-weight: 700 !important; font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial !important; }
    `;
    if (!document.getElementById(STYLE_ID)) {
      const s = document.createElement('style');
      s.id = STYLE_ID;
      s.appendChild(document.createTextNode(css));
      document.head.appendChild(s);
    }
    return () => {
      const ex = document.getElementById(STYLE_ID);
      if (ex && ex.parentNode) ex.parentNode.removeChild(ex);
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

      {mounted && email ? (
        <div style={{ width: '100%', padding: '10px 16px', boxSizing: 'border-box', background: '#fff', borderBottom: '1px solid rgba(14,20,24,0.04)', position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <AccountMenu email={email} />
          </div>
        </div>
      ) : null}

      {mounted && email && typeof window !== 'undefined' && <GlobalRevealInterceptor />}

      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>

      <Footer />

      <LimitModal />
    </>
  );
}
