import React, { useState } from 'react';
import Router from 'next/router';
import {
  getClientEmail,
  canReveal,
  recordReveal,
  incrementReveal,
  setClientSignedIn,
} from '../lib/auth-client';

/**
 * RevealButton
 *
 * - If NOT signed in -> redirect to /plans immediately
 * - If signed in but out of reveals -> show LimitModal
 * - Otherwise attempts the reveal (via revealHandler or POST /api/reveal)
 */
export default function RevealButton({
  target,
  revealHandler, // optional async (target) => ({ success: true, data, usage })
  onSuccess, // optional callback after success
  className,
  style,
  children = 'Reveal',
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick(e) {
    e && e.preventDefault();
    const email = getClientEmail();

    // If no client email, treat as anonymous — take them to Plans immediately
    if (!email) {
      try { Router.push('/plans'); } catch (err) { window.location.href = '/plans'; }
      return;
    }

    if (!canReveal()) {
      // show global limit modal
      try {
        window.dispatchEvent(new CustomEvent('nh_limit_reached', { detail: { type: 'reveal' } }));
      } catch (err) {}
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

        // server indicates upgrade/payment
        if (res.status === 402) {
          try { Router.push('/plans'); } catch (e) { window.location.href = '/plans'; }
          return;
        }

        result = await res.json();
        if (!res.ok) {
          throw new Error(result?.error || 'Reveal failed');
        }
      }

      // If server provided updated usage, persist it
      const serverUsage = result?.usage || (result && result.data && result.data.usage);
      if (serverUsage) {
        setClientSignedIn(email, serverUsage);
      } else {
        // fallback: attempt to increment locally — incrementReveal returns null if at limit
        const updated = incrementReveal();
        if (!updated) {
          // If increment failed due to limit, show modal
          window.dispatchEvent(new CustomEvent('nh_limit_reached', { detail: { type: 'reveal' } }));
          return;
        }
      }

      // Save reveal record locally
      const record = {
        target,
        date: new Date().toISOString(),
        note: (result && result.data && result.data.note) || '',
      };
      try { recordReveal(record); } catch (e) {}

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
