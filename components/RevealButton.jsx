'use client';

import React, { useState } from 'react';

/**
 * Replace any existing client-side reveal button with this.
 * Usage: <RevealButton contactValue="j***@example.com" revealPayload={{ value: 'jane@example.com' }} />
 *
 * - It calls POST /api/reveal with x-nh-session header from localStorage.
 * - Shows the revealed email only if server returns allowed:true.
 * - If not allowed, prompts the user to upgrade/sign in.
 */
export default function RevealButton({ contactValue = 'Reveal', revealPayload = {} }) {
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(null);
  const [error, setError] = useState('');

  async function handleReveal() {
    setError('');
    setLoading(true);
    try {
      const sessionValue = (typeof window !== 'undefined' && localStorage.getItem('nh_session')) || '';
      const res = await fetch('/api/reveal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nh-session': sessionValue,
        },
        body: JSON.stringify({ contact: revealPayload || {} }),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = (body && (body.error || body.message)) || `Server returned ${res.status}`;
        throw new Error(msg);
      }

      // If server explicitly allows revealing, show data (server may return email, or client may display original)
      if (body && body.allowed) {
        // If API returns a concrete email value in payload, prefer that:
        if (body.revealedEmail) setRevealed(body.revealedEmail);
        else setRevealed('Revealed — check the contact UI'); // fallback message
        return;
      }

      // Not allowed — show upgrade/sign-in prompt
      if (body && body.allowed === false) {
        setError('You have reached your reveal limit. Please Upgrade to reveal more.');
      } else {
        setError('Unable to reveal contact. Please sign in or upgrade.');
      }
    } catch (err) {
      console.error('reveal error', err);
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }

  if (revealed) {
    return <span style={{ fontWeight: 700 }}>{revealed}</span>;
  }

  return (
    <div>
      <button onClick={handleReveal} disabled={loading} style={{ padding: '6px 10px' }}>
        {loading ? 'Revealing…' : contactValue}
      </button>
      {error && <div style={{ color: '#ef4444', marginTop: 6 }}>{error}</div>}
    </div>
  );
}
