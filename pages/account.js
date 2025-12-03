// Account page redesign:
// - Usage + Emails Saved + "Unsubscribe from NovaHunt" (calls /api/unsubscribe best-effort)
// - Removed right-side quick links cell (per request)
// - "View saved emails" button opens a modal reading novahunt.savedContacts from localStorage
// - Unsubscribe button color changed to blue (not red)

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ErrorBoundary from '../components/ErrorBoundary';
import { getClientUsage } from '../lib/auth-client';

function SavedEmailsModal({ open, onClose }) {
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem('novahunt.savedContacts') || '[]';
      const arr = JSON.parse(raw);
      setSaved(arr || []);
    } catch (e) {
      setSaved([]);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2200 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
      <div style={{ position: 'relative', width: 'min(760px, 96%)', background: '#fff', borderRadius: 8, padding: 20, zIndex: 2201 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Saved Emails ({saved.length})</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer' }}>×</button>
        </header>

        <div style={{ marginTop: 12 }}>
          {saved.length === 0 ? (
            <div style={{ color: '#6b7280' }}>You have no saved emails yet.</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {saved.map((s, i) => (
                <div key={i} style={{ padding: 10, border: '1px solid #e6edf3', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{s.email}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { navigator.clipboard && navigator.clipboard.writeText(s.email); alert('Email copied'); }} style={{ padding: '6px 8px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' }}>Copy</button>
                    <a href={`mailto:${s.email}`} style={{ padding: '6px 8px', borderRadius: 6, background: '#fff', border: '1px solid #e6edf3', textDecoration: 'none', color: '#0b1220' }}>Email</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const [usage, setUsage] = useState(getClientUsage() || { searches: 0, limitSearches: 0, reveals: 0, limitReveals: 0 });
  const [savedCount, setSavedCount] = useState(0);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);

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
    function readUsage() {
      try {
        const u = getClientUsage();
        setUsage(u || { searches: 0, limitSearches: 0, reveals: 0, limitReveals: 0 });
      } catch (e) {}
    }

    readSaved();
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
      } catch (e) { /* ignore */ }
      setUnsubscribed(true);
      alert('You have been unsubscribed from NovaHunt.');
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

        <section style={{ marginTop: 18 }}>
          <div style={{ background: '#fff', border: '1px solid #e6edf3', borderRadius: 8, padding: 16 }}>
            <h2 style={{ marginTop: 0 }}>Usage</h2>
            <p>Searches: <strong>{usage.searches}/{usage.limitSearches}</strong></p>
            <p>Reveals: <strong>{usage.reveals}/{usage.limitReveals}</strong></p>

            <div style={{ marginTop: 18 }}>
              <h3 style={{ margin: 0 }}>Emails Saved</h3>
              <p style={{ marginTop: 8 }}>You have <strong>{savedCount}</strong> saved email{savedCount !== 1 ? 's' : ''}.</p>
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button onClick={() => setShowSavedModal(true)} style={{ padding: '8px 12px', borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' }}>View saved emails</button>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <h3 style={{ margin: 0 }}>Unsubscribe</h3>
              <p style={{ marginTop: 8 }}>Unsubscribe from NovaHunt emails.</p>
              <div style={{ marginTop: 8 }}>
                <button onClick={handleUnsubscribe} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#0ea5e9', color: '#fff', cursor: 'pointer' }}>
                  {unsubscribed ? 'Unsubscribed' : 'Unsubscribe from NovaHunt'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {showSavedModal && <SavedEmailsModal open={showSavedModal} onClose={() => setShowSavedModal(false)} />}
      </main>
    </ErrorBoundary>
  );
}
