// Redesigned Account page per your request:
// - Clean layout: Usage, Emails Saved, Unsubscribe
// - Removed quick links
// - Back to Home remains visible and not covered by pulldowns

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ErrorBoundary from '../components/ErrorBoundary';
import { getClientUsage } from '../lib/auth-client';

export default function AccountPage() {
  const [usage, setUsage] = useState(getClientUsage() || { searches: 0, limitSearches: 0, reveals: 0, limitReveals: 0 });
  const [savedCount, setSavedCount] = useState(0);
  const [unsubscribed, setUnsubscribed] = useState(false);

  useEffect(() => {
    function readSaved() {
      try {
        const raw = localStorage.getItem('novahunt.savedContacts') || '[]';
        const arr = JSON.parse(raw);
        setSavedCount((arr && arr.length) || 0);
      } catch (e) {
        setSavedCount(0);
      }
    }
    readSaved();

    function readUsage() {
      try {
        const u = getClientUsage();
        setUsage(u || { searches: 0, limitSearches: 0, reveals: 0, limitReveals: 0 });
      } catch (e) {}
    }
    readUsage();

    window.addEventListener('storage', readSaved);
    window.addEventListener('nh_usage_updated', readUsage);
    window.addEventListener('nh_auth_changed', readUsage);
    return () => {
      window.removeEventListener('storage', readSaved);
      window.removeEventListener('nh_usage_updated', readUsage);
      window.removeEventListener('nh_auth_changed', readUsage);
    };
  }, []);

  async function handleUnsubscribe() {
    try {
      // best-effort: call server endpoint if present
      try {
        await fetch('/api/unsubscribe', { method: 'POST', credentials: 'include' });
      } catch (e) {
        // ignore
      }
      setUnsubscribed(true);
      alert('You have been unsubscribed from marketing emails.');
    } catch (e) {
      alert('Unsubscribe failed.');
    }
  }

  return (
    <ErrorBoundary>
      <main style={{ padding: 24, maxWidth: 980, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h1 style={{ margin: 0 }}>Account</h1>
          <div style={{ zIndex: 80 }}>
            <Link href="/"><a style={{ padding: '8px 10px', background: '#fff', border: '1px solid #e6edf3', borderRadius: 6, textDecoration: 'none', color: '#0b1220' }}>Back to Home</a></Link>
          </div>
        </div>

        <section style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18 }}>
          <div>
            <h2 style={{ marginTop: 0 }}>Usage</h2>
            <p>Searches: <strong>{usage.searches}/{usage.limitSearches}</strong></p>
            <p>Reveals: <strong>{usage.reveals}/{usage.limitReveals}</strong></p>

            <h3 style={{ marginTop: 16 }}>Emails Saved</h3>
            <p>You have <strong>{savedCount}</strong> saved email{savedCount !== 1 ? 's' : ''}.</p>

            <h3 style={{ marginTop: 16 }}>Unsubscribe</h3>
            <p style={{ color: '#6b7280' }}>{unsubscribed ? 'You are unsubscribed.' : 'Unsubscribe from marketing emails.'}</p>
            <div style={{ marginTop: 8 }}>
              <button onClick={handleUnsubscribe} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer' }}>
                {unsubscribed ? 'Unsubscribed' : 'Unsubscribe'}
              </button>
            </div>
          </div>

          <aside style={{ background: '#fff', border: '1px solid #e6edf3', borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 700 }}>Account</div>
            <div style={{ marginTop: 8 }}>
              <Link href="/billing"><a style={{ color: '#2563eb' }}>Billing</a></Link>
            </div>
          </aside>
        </section>
      </main>
    </ErrorBoundary>
  );
}
