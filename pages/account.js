// pages/account.js (improved)
// - Reads server saved contacts if available.
// - Falls back to client-local saved contacts stored in localStorage 'nh_saved_contacts'.
// - "No saved contacts" message changed and greyed.
// - Listens to nh_saved_contact and storage markers to refresh.

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { getClientEmail } from '../lib/auth-client';
import AccountSavedUpdater from '../components/AccountSavedUpdater';
import Router from 'next/router';

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState([]);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState(null);

  useEffect(() => {
    try {
      const e = getClientEmail();
      setEmail(e || null);
    } catch (e) {
      setEmail(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function fetchSaved() {
      setLoading(true);
      setError(null);

      const endpoints = [
        '/api/saved-contacts',
        '/api/get-saved-contacts',
        '/api/my-saved-contacts',
        '/api/account/saved-contacts',
        '/api/saved',
      ];

      let got = null;
      for (const url of endpoints) {
        try {
          const res = await fetch(url, { credentials: 'same-origin' });
          if (!res) continue;
          if (res.status === 404 || res.status === 410) continue;
          const txt = await res.text().catch(() => null);
          if (!txt) continue;
          try {
            const json = JSON.parse(txt);
            if (Array.isArray(json)) { got = json; break; }
            if (Array.isArray(json.saved)) { got = json.saved; break; }
            if (Array.isArray(json.contacts)) { got = json.contacts; break; }
            const arr = Object.values(json).find(v => Array.isArray(v));
            if (arr) { got = arr; break; }
          } catch (e) {
            continue;
          }
        } catch (err) {
          continue;
        }
      }

      // fallback to localStorage 'nh_saved_contacts'
      try {
        if (!got) {
          const raw = localStorage.getItem('nh_saved_contacts') || '[]';
          const arr = JSON.parse(raw);
          if (Array.isArray(arr) && arr.length > 0) {
            got = arr;
          }
        } else {
          // also merge local saved (dedupe by email)
          const raw = localStorage.getItem('nh_saved_contacts') || '[]';
          const arr = JSON.parse(raw);
          if (Array.isArray(arr) && arr.length > 0) {
            const emails = new Set((got || []).map(x => (x.email || '').toLowerCase()));
            for (const item of arr) {
              if (!emails.has((item.email || '').toLowerCase())) got.unshift(item);
            }
          }
        }
      } catch (e) {
        // ignore localStorage parse errors
      }

      if (mounted) {
        if (got && got.length > 0) {
          setSaved(got);
          setLoading(false);
        } else {
          setSaved([]);
          setLoading(false);
          // show simpler message (grey) when there are no saved contacts
          setError(null);
        }
      }
    }

    fetchSaved();

    function savedHandler() {
      fetchSaved();
    }

    window.addEventListener('nh_saved_contact', savedHandler);
    window.addEventListener('nh_saved_contacts_last_update', savedHandler);
    window.addEventListener('nh_usage_updated', savedHandler);
    function storageHandler(e) {
      if (!e || !e.key) return;
      if (['nh_saved_contacts_last_update', 'nh_usage_last_update'].includes(e.key)) {
        fetchSaved();
      }
    }
    window.addEventListener('storage', storageHandler);

    return () => {
      mounted = false;
      window.removeEventListener('nh_saved_contact', savedHandler);
      window.removeEventListener('nh_saved_contacts_last_update', savedHandler);
      window.removeEventListener('nh_usage_updated', savedHandler);
      window.removeEventListener('storage', storageHandler);
    };
  }, []);

  return (
    <>
      <Head><title>Account</title></Head>

      <main style={{ maxWidth: 980, margin: '20px auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h1 style={{ margin: 0 }}>Account</h1>
            <div style={{ color: '#555', marginTop: 6 }}>{email ? `Signed in as ${email}` : 'Not signed in'}</div>
          </div>
          <div>
            <a href="/" className="go-home-button" style={{ textDecoration: 'none', color: '#0b1220', fontWeight: 700 }}>Back to Homepage</a>
          </div>
        </div>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ marginBottom: 8 }}>Saved Reveals</h2>
          {loading ? (
            <div style={{ color: '#6b7280' }}>Loading saved contacts…</div>
          ) : (saved && saved.length > 0) ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {saved.map((c, i) => (
                <div key={c.id || c.email || i} style={{ padding: 12, borderRadius: 8, background: '#fff', border: '1px solid #e6edf3' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{(c.first_name || c.name || '') + (c.last_name ? ` ${c.last_name}` : '')}</div>
                      <div style={{ color: '#6b7280', fontSize: 13 }}>{c.email || c.revealedEmail || c.address || ''}</div>
                      {c.domain ? <div style={{ color: '#6b7280', fontSize: 13 }}>{c.domain}</div> : null}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                      <a href={c.source || '#'} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#2563eb' }}>source</a>
                      <button onClick={async () => {
                        try {
                          const idx = saved.indexOf(c);
                          const newSaved = [...saved];
                          newSaved.splice(idx, 1);
                          setSaved(newSaved);
                          // try server delete endpoints (best-effort)
                          const delEndpoints = ['/api/delete-saved-contact', '/api/remove-saved-contact', '/api/saved-contacts'];
                          for (const url of delEndpoints) {
                            try {
                              const res = await fetch(url, {
                                method: url.endsWith('/saved-contacts') ? 'PUT' : 'POST',
                                credentials: 'same-origin',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: c.email, id: c.id, domain: c.domain }),
                              });
                              if (res && (res.status === 200 || res.status === 204)) break;
                            } catch (err) {}
                          }
                          try { localStorage.setItem('nh_saved_contacts_last_update', String(Date.now())); } catch (e) {}
                          try { window.dispatchEvent(new CustomEvent('nh_saved_contact', { detail: { removed: c } })); } catch (e) {}
                        } catch (err) {
                          console.error('remove saved contact err', err);
                        }
                      }} style={{ padding: '6px 8px', borderRadius: 6, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer' }}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#9ca3af' }}>No saved contacts found.</div>
          )}
        </section>

        <section>
          <h2 style={{ marginBottom: 8 }}>Account actions</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { Router.push('/plans'); }} style={{ padding: '8px 10px', borderRadius: 8, background: '#fff', border: '1px solid #e6edf3', cursor: 'pointer' }}>Change plan</button>
            <button onClick={async () => {
              try {
                await fetch('/api/auth/signout', { method: 'POST', credentials: 'same-origin' }).catch(()=>null);
              } catch (e) {}
              try { localStorage.removeItem('nh_user_email'); } catch (e) {}
              try { window.dispatchEvent(new Event('nh_auth_changed')); } catch (e) {}
              Router.push('/');
            }} style={{ padding: '8px 10px', borderRadius: 8, background: '#0ea5e9', color: '#fff', border: 'none', cursor: 'pointer' }}>Sign out</button>
          </div>
        </section>
      </main>

      <AccountSavedUpdater autoReloadOnAccount={false} />
    </>
  );
}
