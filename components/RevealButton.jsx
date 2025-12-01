import React, { useState } from 'react';
import Router from 'next/router';
import {
  getClientEmail,
  canReveal,
  recordReveal,
  incrementReveal,
} from '../lib/auth-client';

/**
 * RevealButton
 *
 * - If NOT signed in -> redirect to /plans (per product requirement)
 * - If signed in but out of reveals -> redirect to /plans
 * - Otherwise attempts the reveal (via revealHandler or POST /api/reveal)
 * - On success updates client-side reveal history and usage and dispatches events
 */

export default function RevealButton({
  target,
  revealHandler, // optional async (target) => ({ success: true, data })
  onSuccess, // optional callback after success
  className,
  style,
  children = 'Reveal',
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick(e) {
    e && e.preventDefault();
    const email = getClientEmail();

    // NOTE: change requested — unauthenticated visitors should be directed to Plans
    if (!email) {
      Router.push('/plans');
      return;
    }

    // Signed in but check client-side quota first
    if (!canReveal()) {
      // User out of reveals -> go to Plans
      Router.push('/plans');
      return;
    }

    setLoading(true);
    try {
      let result = null;
      if (typeof revealHandler === 'function') {
        result = await revealHandler(target);
      } else {
        const res = await fetch('/api/reveal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target }),
          credentials: 'include',
        });
        if (res.status === 402) {
          // Server demands upgrade/payment
          Router.push('/plans');
          return;
        }
        result = await res.json();
        if (!res.ok) {
          throw new Error(result?.error || 'Reveal failed');
        }
      }

      // record and increment client state
      const record = {
        target,
        date: new Date().toISOString(),
        note: (result && result.data && result.data.note) || '',
      };
      try { recordReveal(record); } catch (e) {}
      try { incrementReveal(); } catch (e) {}

      if (typeof onSuccess === 'function') onSuccess(result && result.data);
    } catch (err) {
      console.error('Reveal failed', err);
      alert(err.message || 'Reveal failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={className}
      style={style}
      aria-busy={loading}
    >
      {loading ? 'Revealing…' : children}
    </button>
  );
}
