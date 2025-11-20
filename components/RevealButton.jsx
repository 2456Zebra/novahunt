'use client';

import { useEffect, useState } from 'react';
import { getLocalSession } from '../utils/auth';

/**
 * RevealButton (updated)
 * - On successful reveal, increment nh_usage.revealsUsed in localStorage and dispatch account-usage-updated
 * - If anonymous, opens modal with prefill and records pending reveal
 */

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

  function updateLocalUsageAfterReveal(serverUsage) {
    try {
      // Prefer server usage if provided, otherwise increment local
      if (serverUsage) {
        localStorage.setItem('nh_usage', JSON.stringify(serverUsage));
      } else {
        const raw = localStorage.getItem('nh_usage');
        const current = raw ? JSON.parse(raw) : { searchesUsed: 0, searchesTotal: 5, revealsUsed: 0, revealsTotal: 2 };
        const next = { ...current, revealsUsed: Math.min(current.revealsTotal, (current.revealsUsed || 0) + 1) };
        localStorage.setItem('nh_usage', JSON.stringify(next));
      }
      window.dispatchEvent(new CustomEvent('account-usage-updated'));
    } catch (e) {}
  }

  async function doRevealInternal(cid, pl) {
    setLoading(true);
    setError('');
    try {
      const session = getLocalSession();
      const token = session && session.token ? session.token : '';
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
        // update local usage so header & account dropdown reflect the reveal
        updateLocalUsageAfterReveal(json.usage);
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
