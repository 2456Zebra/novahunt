'use client';

import { useEffect, useState } from 'react';
import { getLocalSession } from '../utils/auth';

/**
 * RevealButton
 * - If user is not signed in, opens SignIn modal and records a pending reveal.
 * - When the user signs in (nh-signed-in event), an automatic retry is attempted.
 * - Uses getLocalSession() to find token (session.token).
 */

export default function RevealButton({ contactId, payload, onRevealed }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If a sign-in occurs elsewhere, try to replay a pending reveal
  useEffect(() => {
    function onSignedIn() {
      try {
        const pending = window.__nh_pending_reveal;
        if (pending && pending.contactId === contactId) {
          // Only retry if pending is for this contact (could be global)
          doRevealInternal(pending.contactId, pending.payload);
          // clear pending to avoid duplicate retries
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
        // remember pending reveal globally so it can be retried after signin
        try {
          window.__nh_pending_reveal = { contactId, payload };
          // open sign-in modal and pass prefill (if we have an email)
          const prefill = (payload && payload.email) ? String(payload.email) : '';
          try {
            window.dispatchEvent(new CustomEvent('open-signin-modal', { detail: { prefillEmail: prefill } }));
          } catch (e) {
            // fallback to old event
            window.dispatchEvent(new CustomEvent('open-signin-modal'));
          }
        } catch (e) {}
        setLoading(false);
        return;
      }

      // Have a session: perform reveal immediately
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
