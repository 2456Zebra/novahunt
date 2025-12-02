import React, { useEffect, useState } from 'react';
import { getClientEmail, getClientUsage, getRevealHistory, clearClientSignedIn, setClientSignedIn } from '../lib/auth-client';
import Router from 'next/router';

/*
pages/account.js
- Back to Dashboard button
- Save button now attempts to persist to /api/account and falls back to localStorage
- Listens for in-tab usage/reveal updates so UI refreshes immediately
*/

export default function AccountPage() {
  const [email, setEmail] = useState(null);
  const [usage, setUsage] = useState({ searches:0, reveals:0, limitSearches:0, limitReveals:0, plan: null });
  const [reveals, setReveals] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const read = () => {
      setEmail(getClientEmail());
      setUsage(getClientUsage());
      setReveals(getRevealHistory());
    };
    read();

    function onUpdate() {
      read();
    }

    window.addEventListener('storage', onUpdate);
    window.addEventListener('nh_usage_updated', onUpdate);
    window.addEventListener('nh_reveals_updated', onUpdate);
    window.addEventListener('nh_auth_changed', onUpdate);

    return () => {
      window.removeEventListener('storage', onUpdate);
      window.removeEventListener('nh_usage_updated', onUpdate);
      window.removeEventListener('nh_reveals_updated', onUpdate);
      window.removeEventListener('nh_auth_changed', onUpdate);
    };
  }, []);

  function handleSignOut() {
    clearClientSignedIn();
    Router.push('/');
  }

  async function handleSave() {
    setStatusMessage('Saving…');
    try {
      // Try server save first
      const payload = { email, usage };
      const res = await fetch('/api/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (res.ok) {
        const body = await res.json();
        // If server returns authoritative usage, persist it
        if (body && body.usage) {
          setClientSignedIn(email, body.usage);
        } else {
          // server didn't return usage, just ensure local is persisted
          setClientSignedIn(email, usage);
        }
        setStatusMessage('Saved.');
      } else {
        // fallback to local-only save
        try {
          setClientSignedIn(email, usage);
          setStatusMessage('Saved locally (server returned error).');
        } catch (e) {
          setStatusMessage('Save failed.');
        }
      }
    } catch (err) {
      // network or endpoint not present — fallback to local-only
      try {
        setClientSignedIn(email, usage);
        setStatusMessage('Saved locally (offline).');
      } catch (e) {
        setStatusMessage('Save failed.');
      }
    }
    // clear status text after a short while
    setTimeout(() => setStatusMessage(''), 2500);
  }

  function handleBackToDashboard() {
    Router.push('/');
  }

  return (
    <main style={{ maxWidth: 980, margin: '28px auto', padding: '0 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h1>Account</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleBackToDashboard} style={{ padding: '8px 12px', borderRadius: 8, background: '#fff', border: '1px solid #e6e6e6' }}>
            Back to Dashboard
          </button>
        </div>
      </div>

      <section style={{ marginTop: 20, background: '#fff', padding: 18, borderRadius: 8, border: '1px solid #eee' }}>
        <h3>Signed in as:</h3>
        <div style={{ fontWeight: 700 }}>{email || '—'}</div>

        <h3 style={{ marginTop: 18 }}>Usage & Limits</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ padding: 12, background: '#f9fafb', borderRadius: 8 }}>
            <div style={{ color: '#6b7280' }}>Searches used</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{usage.searches ?? 0}</div>
            <div style={{ color: '#6b7280', marginTop: 6 }}>Searches limit</div>
            <div style={{ fontSize: 16 }}>{usage.limitSearches ?? 0}</div>
          </div>

          <div style={{ padding: 12, background: '#f9fafb', borderRadius: 8 }}>
            <div style={{ color: '#6b7280' }}>Reveals used</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{usage.reveals ?? 0}</div>
            <div style={{ color: '#6b7280', marginTop: 6 }}>Reveals limit</div>
            <div style={{ fontSize: 16 }}>{usage.limitReveals ?? 0}</div>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <button onClick={handleSave} style={{ padding: '8px 12px', borderRadius: 8, background: '#0b74ff', color: '#fff', border: 'none' }}>
            Save
          </button>
          <button onClick={handleSignOut} style={{ marginLeft: 12, padding: '8px 12px', borderRadius: 8, background: '#fff', color: '#111', border: '1px solid #e6e6e6' }}>
            Sign out
          </button>
          {statusMessage && <span style={{ marginLeft: 12, color: '#444' }}>{statusMessage}</span>}
        </div>
      </section>

      <section style={{ marginTop: 18 }}>
        <h3>Reveal history</h3>
        {reveals.length === 0 ? (
          <div style={{ color: '#6b7280' }}>No reveals yet</div>
        ) : (
          <div style={{ marginTop: 8 }}>
            {reveals.map((r, i) => (
              <div key={i} style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #eee', marginBottom: 8 }}>
                <div style={{ fontWeight: 700 }}>{r.item || r.target || 'Reveal'}</div>
                <div style={{ color: '#6b7280', marginTop: 6 }}>{r.date || ''}</div>
                <div style={{ marginTop: 8, fontSize: 13 }}>{r.note || ''}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
