'use client';

import React, { useState } from 'react';

/**
 * RevealButton: server-authorized reveal.
 * Props:
 *  - label (string) text to show on the button
 *  - contact (object) optional contact data to send to server
 *
 * The button calls /api/reveal and only displays the revealed value if server returns allowed:true.
 */
export default function RevealButton({ label = 'Reveal', contact = {} }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function onClick() {
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
        body: JSON.stringify({ contact }),
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = (body && (body.error || body.message)) || `Server returned ${res.status}`;
        throw new Error(msg);
      }

      if (body && body.allowed) {
        // If server included a revealed email value, use it; otherwise display generic revealed state
        if (body.revealedEmail) setResult(body.revealedEmail);
        else setResult('Revealed');
        return;
      }

      if (body && body.allowed === false) {
        setError('Reveal not allowed — upgrade or sign in.');
      } else {
        setError('Unable to reveal (sign-in required)');
      }
    } catch (err) {
      console.error('reveal error', err);
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }

  if (result) return <span style={{ fontWeight: 700 }}>{result}</span>;

  return (
    <div>
      <button onClick={onClick} disabled={loading} style={{ padding: '6px 10px' }}>
        {loading ? 'Revealing…' : label}
      </button>
      {error && <div style={{ color: '#ef4444', marginTop: 6 }}>{error}</div>}
    </div>
  );
}
