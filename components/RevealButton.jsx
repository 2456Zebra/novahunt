'use client';

import { useEffect, useState } from 'react';
import { getLocalSession } from '../utils/auth';

/**
 * RevealButton
 * - If user is not signed in, opens SignIn modal and records a pending reveal.
 * - When the user signs in (nh-signed-in event), an automatic retry is attempted.
 * - Uses getLocalSession() to find token (session.token).
 * - If API responds with usage, persist it to localStorage (nh_usage).
 */

function persistServerUsage(usage) {
  try {
    if (!usage) return;
    localStorage.setItem('nh_usage', JSON.stringify(usage));
    window.dispatchEvent(new CustomEvent('account-usage-updated'));
  } catch (e) {}
}

export default function RevealButton({ contactId, payload, onRevealed }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    function onSignedIn() {
      try {
        const pending = window.__nh_pending_reveal;
        if (pending && pending.contactId === contactId) {
          doRevealInternal(pending.contactId, pending.payload);
          delete window.__nh_pending_reveal;
        }
      } catch (e) {}
    }
    window.addEventListener('nh-signed-in', onSignedIn);
    return () => window.removeEventListener('nh-signed-in', onSignedIn);
  }, [contactId]);

  async function doRevealInternal(cid, pl) {
    setLoading(true);
    setError('');
    try {
      const session = getLocalSession();
      const token = session && session.token ? session.token : (typeof session === 'string' ? session : '');
      const res = await fetch('/api/reveal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nh-session': token || ''
        },
        body: JSON.stringify({ contactId: cid, ...pl || {} })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error || `Reveal failed (${res.status})`);
      } else {
        onRevealed && onRevealed(json.revealed || {});
        // persist server usage if provided
        if (json.usage) persistServerUsage(json.usage);
        try { window.dispatchEvent(new Event('account-usage-updated')); } catch (e) {}
      }
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function doReveal() {
    setError('');
    setLoading(true);
    try {
      const session = getLocalSession();
      if (!session) {
        try {
          window.__nh_pending_reveal = { contactId, payload };
          const prefill = (payload && payload.email) ? String(payload.email) : '';
          try {
            window.dispatchEvent(new CustomEvent('open-signin-modal', { detail: { prefillEmail: prefill } }));
          } catch (e) {
            window.dispatchEvent(new CustomEvent('open-signin-modal'));
          }
        } catch (e) {}
        setLoading(false);
        return;
      }

      await doRevealInternal(contactId, payload);
    } catch (e) {
      setError(String(e?.message || e));
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={doReveal} disabled={loading} style={{
        padding: '6px 8px',
        borderRadius: 6,
        border: '1px solid #ddd',
        background: loading ? '#f3f4f6' : '#fff',
        cursor: 'pointer'
      }}>
        {loading ? 'Revealing…' : 'Reveal Full Email'}
      </button>
      {error && <div style={{ color: 'crimson', marginTop: 6 }}>{error}</div>}
    </div>
  );
}
