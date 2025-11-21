'use client';

import { useEffect, useState, useRef } from 'react';
import { signOut, getLocalSession } from '../utils/auth';
import Link from 'next/link';

/**
 * HeaderAuth - shows Sign in / Sign up when not signed in
 * When signed in, shows a small dropdown with usage and account links.
 *
 * Usage is read from localStorage key 'nh_usage' if present:
 * { searchesUsed, searchesTotal, revealsUsed, revealsTotal }
 * Default: zeros for a fresh account until the server authoritatively provides values.
 */

function ProgressBar({ used = 0, total = 1 }) {
  const pct = Math.min(100, Math.round((used / Math.max(1, total)) * 100));
  return (
    <div style={{ width: 180, background: '#f3f4f6', borderRadius: 6, height: 10 }}>
      <div style={{ width: `${pct}%`, background: '#f97316', height: '100%', borderRadius: 6 }} />
    </div>
  );
}

export default function HeaderAuth() {
  const [session, setSession] = useState(getLocalSession());
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // usage defaults to zeros for a fresh account
  const [usage, setUsage] = useState({ searchesUsed: 0, searchesTotal: 5, revealsUsed: 0, revealsTotal: 2 });

  useEffect(() => {
    function updateSession() {
      setSession(getLocalSession());
    }
    window.addEventListener('account-usage-updated', onUsageUpdated);
    window.addEventListener('account-usage-updated', updateSession);
    window.addEventListener('nh-signed-in', updateSession);
    return () => {
      window.removeEventListener('account-usage-updated', onUsageUpdated);
      window.removeEventListener('account-usage-updated', updateSession);
      window.removeEventListener('nh-signed-in', updateSession);
    };
  }, []);

  useEffect(() => {
    function onDoc(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  // read usage from localStorage when this component mounts or when account-usage-updated fires
  function onUsageUpdated() {
    try {
      const raw = localStorage.getItem('nh_usage');
      if (raw) {
        const parsed = JSON.parse(raw);
        setUsage(u => ({ ...u, ...parsed }));
        return;
      }
    } catch (e) { /* ignore parse errors */ }
    // fallback remains current usage state (initial zeros)
  }

  if (!session) {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => (window.dispatchEvent(new CustomEvent('open-signin-modal')))} className="btn">Sign in</button>
        <button onClick={() => (window.location.href = '/signup')} className="btn btn-primary">Sign up</button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button onClick={() => setOpen(!open)} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff' }}>
        <span style={{ fontWeight: 700 }}>{session.email}</span>
        <span style={{ color: '#6b7280' }}>{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div style={{ position: 'absolute', right: 0, marginTop: 8, width: 320, background: '#fff', border: '1px solid #e6e6e6', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.06)', zIndex: 999 }}>
          <div style={{ padding: 12 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Account usage</div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 13, color: '#374151' }}>Searches</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>{usage.searchesUsed}/{usage.searchesTotal}</div>
            </div>
            <ProgressBar used={usage.searchesUsed} total={usage.searchesTotal} />

            <div style={{ height: 12 }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 13, color: '#374151' }}>Reveals</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>{usage.revealsUsed}/{usage.revealsTotal}</div>
            </div>
            <ProgressBar used={usage.revealsUsed} total={usage.revealsTotal} />

            <div style={{ height: 10 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <Link href="/account" style={{ padding: '8px 10px', textDecoration: 'none', border: '1px solid #e5e7eb', borderRadius: 6, color: '#111' }}>Account</Link>
              <Link href="/plans" style={{ padding: '8px 10px', textDecoration: 'none', background: '#f97316', color: '#fff', borderRadius: 6 }}>Upgrade</Link>
            </div>

            <div style={{ borderTop: '1px solid #f3f4f6', marginTop: 12, paddingTop: 10, display: 'flex', gap: 8 }}>
              <button onClick={() => { window.location.href = '/unsubscribe'; }} style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #e5e7eb' }}>Unsubscribe</button>
              <button onClick={() => { signOut(); }} style={{ flex: 1, padding: 8, borderRadius: 6, background: '#ef4444', color: '#fff', border: 'none' }}>Sign out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
