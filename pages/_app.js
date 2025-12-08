import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Footer from '../components/Footer';
import LimitModal from '../components/LimitModal';
import ErrorBoundary from '../components/ErrorBoundary';
import { getClientEmail, getClientUsage, clearClientSignedIn } from '../lib/auth-client';
import Router from 'next/router';
import GlobalRevealInterceptor from '../components/GlobalRevealInterceptor';

/**
 * Defensive client auth/session handling:
 * - Uses /api/me as the authoritative signed-in source and writes nh_user_email
 * - Attempts /api/session-info; if it returns missing session_id, tries candidate cookie values
 *   by POSTing { session_id } as a fallback.
 * - Sign out tries POST/GET/DELETE on common endpoints, clears client state immediately,
 *   then polls /api/me a few times and warns if server still reports authenticated.
 */

function normalizeUsage(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const out = {};
  out.searches = obj.searches ?? obj.usedSearches ?? obj.search_count ?? obj.searches_used ?? obj.searchesCount ?? 0;
  out.reveals = obj.reveals ?? obj.usedReveals ?? obj.reveal_count ?? obj.reveals_used ?? 0;
  out.limitSearches = obj.limitSearches ?? obj.maxSearches ?? obj.quotaSearches ?? obj.search_limit ?? obj.limit_searches ?? 0;
  out.limitReveals = obj.limitReveals ?? obj.maxReveals ?? obj.quotaReveals ?? obj.reveal_limit ?? obj.limit_reveals ?? 0;
  out.plan = obj.plan ?? obj.tier ?? obj.product ?? null;

  if (!out.searches && obj.usage && typeof obj.usage === 'object') return normalizeUsage(obj.usage);
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
                onClick={async () => {
                  // robust signout: try several endpoints/methods
                  const endpoints = [
                    { url: '/api/auth/signout', method: 'POST' },
                    { url: '/api/signout', method: 'POST' },
                    { url: '/api/auth/sign-out', method: 'POST' },
                    { url: '/api/auth/logout', method: 'POST' },
                    { url: '/api/logout', method: 'POST' },
                    { url: '/api/auth/signout', method: 'GET' },
                    { url: '/api/signout', method: 'GET' },
                    { url: '/api/logout', method: 'GET' },
                    { url: '/api/auth/signout', method: 'DELETE' },
                    { url: '/api/signout', method: 'DELETE' },
                  ];
                  for (const ep of endpoints) {
                    try {
                      await fetch(ep.url, { method: ep.method, credentials: 'same-origin' }).catch(()=>null);
                    } catch (e) {}
                  }

                  // immediate client-side cleanup
                  try { clearClientSignedIn(); } catch (e) {}
                  try {
                    localStorage.removeItem('nh_user_email');
                    localStorage.removeItem('nh_usage');
                    localStorage.removeItem('nh_saved_contacts_last_update');
                    localStorage.removeItem('nh_saved_contacts');
                    localStorage.removeItem('nh_usage_last_update');
                    localStorage.removeItem('nh_last_domain');
                  } catch (e) {}

                  // best-effort cookie deletion
                  try {
                    const names = ['session', 'session_id', 'sb:token', 'session_token', 'supabase-auth-token', 'auth'];
                    names.forEach(n => {
                      try {
                        document.cookie = `${n}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure`;
                        document.cookie = `${n}=; Domain=${window.location.hostname}; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure`;
                      } catch (e) {}
                    });
                  } catch (e) {}

                  try { window.dispatchEvent(new Event('nh_auth_changed')); } catch (e) {}

                  // poll /api/me a few times to verify server session cleared; alert if still active
                  let stillAuth = false;
                  for (let i = 0; i < 5; i++) {
                    try {
                      const r = await fetch('/api/me', { credentials: 'same-origin' });
                      const txt = await r.text().catch(()=>null);
                      if (!r.ok) { stillAuth = false; break; }
                      if (!txt) { stillAuth = false; break; }
                      try {
                        const body = JSON.parse(txt);
                        if (!body || !body.authenticated) { stillAuth = false; break; }
                        stillAuth = true;
                      } catch (e) { stillAuth = false; break; }
                    } catch (e) { stillAuth = false; break; }
                    await new Promise(res => setTimeout(res, 300));
                  }
                  if (stillAuth) {
                    try { alert('Sign out attempted but server session still appears active. Try a hard refresh / clear cookies. If this persists contact support.'); } catch (e) {}
                    console.warn('server still reports authenticated after signout attempts');
                  }
                  try { Router.push('/'); } catch (e) { window.location.href = '/'; }
                }}
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

    async function trySessionInfoWithSessionId(sessionId) {
      try {
        const res = await fetch('/api/session-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ session_id: sessionId }),
        });
        if (!res.ok) return null;
        const body = await res.json().catch(()=>null);
        return body;
      } catch (e) { return null; }
    }

    async function readAuthAndSession() {
      try {
        const r = await fetch('/api/me', { credentials: 'same-origin' });
        const txt = await r.text().catch(()=>null);
        if (r.ok && txt) {
          let body = null;
          try { body = JSON.parse(txt); } catch (e) { body = null; }
          if (body && body.authenticated) {
            const eMail = (body.user && (body.user.email || body.user.id)) || body.email || null;
            if (eMail) {
              setEmail(eMail);
              try { localStorage.setItem('nh_user_email', eMail); } catch (err) {}
            }
            // First try normal GET session-info
            try {
              const sess = await fetch('/api/session-info', { credentials: 'same-origin' });
              if (sess && sess.ok) {
                const sessBody = await sess.json().catch(()=>null);
                const normalized = normalizeUsage(sessBody);
                if (normalized) {
                  try {
                    localStorage.setItem('nh_usage', JSON.stringify(normalized));
                    try { window.dispatchEvent(new CustomEvent('nh_usage_updated')); } catch (e) {}
                  } catch (e) {}
                }
              } else {
                // if error and server indicates missing session_id try to post candidate cookie values
                const errText = await sess.text().catch(()=>null);
                let parsed = null;
                try { parsed = JSON.parse(errText); } catch (e) { parsed = null; }
                const missing = parsed && parsed.error && parsed.error.toLowerCase().includes('missing session_id');
                if (missing) {
                  // try cookies as possible session ids
                  const cookies = document.cookie ? document.cookie.split(';').map(s => s.trim()) : [];
                  for (const c of cookies) {
                    const parts = c.split('=');
                    if (!parts || parts.length < 2) continue;
                    const val = parts.slice(1).join('=');
                    const tryBody = await trySessionInfoWithSessionId(val);
                    if (tryBody) {
                      const normalized = normalizeUsage(tryBody);
                      if (normalized) {
                        try { localStorage.setItem('nh_usage', JSON.stringify(normalized)); } catch (e) {}
                        try { window.dispatchEvent(new CustomEvent('nh_usage_updated')); } catch (e) {}
                        break;
                      }
                    }
                  }
                }
              }
            } catch (e) {
              console.error('session-info attempt error', e);
            }

            try { window.dispatchEvent(new Event('nh_auth_changed')); } catch (e) {}
            return;
          }
        }
      } catch (err) {
        console.error('readAuth /api/me error', err);
      }

      // fallback to client-side stored email if /api/me failed
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

    const onStore = (e) => {
      if (!e) return;
      if (['nh_user_email', 'nh_usage', 'nh_usage_last_update', 'nh_saved_contacts_last_update'].includes(e.key)) {
        try { const v = localStorage.getItem('nh_user_email'); setEmail(v || null); } catch (err) {}
      }
    };

    window.addEventListener('storage', onStore);
    return () => {
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
