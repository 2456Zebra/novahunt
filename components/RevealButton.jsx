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
 * Usage:
 * <RevealButton target="monsterenergy.com" />
 *
 * Or with a custom revealHandler:
 * <RevealButton target={id} revealHandler={async (target) => { ...returns data... }} onSuccess={(data)=>{...}} />
 *
 * Behavior:
 * - If the user is not signed in -> redirect to /signin
 * - If the user is signed in but has exhausted reveals -> redirect to /plans
 * - Otherwise attempts to perform the reveal:
 *    - If a revealHandler prop is supplied it will call that and expect a successful result.
 *    - Otherwise it will POST to /api/reveal (default server endpoint) with { target }.
 * - On success it records the reveal in localStorage (nh_reveals) and increments local nh_usage.reveals.
 * - Prevents accidental redirects to Plans for signed-in users who are within limits.
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
    if (!email) {
      // Not signed in -> go to Signin (so they can sign up / sign in)
      Router.push('/signin');
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
        // Default server call — adapt path to your API
        const res = await fetch('/api/reveal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target }),
          credentials: 'include',
        });
        if (res.status === 402) {
          // Server demands payment / upgrade
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
      // Graceful fallback: if server returns a payment-needed status or similar, redirect to plans
      // Otherwise show an alert for now (replaceable with nicer UI)
      // eslint-disable-next-line no-console
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
