import React, { useEffect, useState } from 'react';
import { getClientEmail, getClientUsage, getRevealHistory, clearClientSignedIn } from '../lib/auth-client';
import Router from 'next/router';

/*
pages/account.js
- Now listens for in-tab updates so Usage & Reveal history reflect actions immediately.
*/

export default function AccountPage() {
  const [email, setEmail] = useState(null);
  const [usage, setUsage] = useState({ searches:0, reveals:0, limitSearches:0, limitReveals:0, plan: null });
  const [reveals, setReveals] = useState([]);

  useEffect(() => {
    const read = () => {
      setEmail(getClientEmail());
      setUsage(getClientUsage());
      setReveals(getRevealHistory());
    };
    read();

    function onUpdate(e) {
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

  return (
    <main style={{ maxWidth: 980, margin: '28px auto', padding: '0 18px' }}>
      <h1>Account</h1>

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
          <button onClick={() => { /* placeholder save — server sync should be added here */ }} style={{ padding: '8px 12px', borderRadius: 8, background: '#0b74ff', color: '#fff', border: 'none' }}>
            Save
          </button>
          <button onClick={handleSignOut} style={{ marginLeft: 12, padding: '8px 12px', borderRadius: 8, background: '#fff', color: '#111', border: '1px solid #e6e6e6' }}>
            Sign out
          </button>
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
