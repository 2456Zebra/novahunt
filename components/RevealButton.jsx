import React, { useState } from 'react';
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
 * - If NOT signed in -> dispatch event to show SignInModal
 * - If signed in but out of reveals -> dispatch event to show UpgradeModal
 * - Otherwise attempts the reveal (via revealHandler or POST /api/reveal)
 * - On success:
 *    - If server returns updated usage, replace local nh_usage with server usage (preferred)
 *    - Otherwise increment local reveal count
 *    - Record reveal history and dispatch events so header/account update immediately
 *    - Dispatch event to show RevealResultModal with result data
 */

function dispatchShowModal(name, detail = {}) {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(name, { detail }));
    }
  } catch (e) { /* ignore */ }
}

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

    if (!email) {
      dispatchShowModal('nh_show_signin_modal');
      return;
    }

    if (!canReveal()) {
      dispatchShowModal('nh_show_upgrade_modal', { reason: 'reveals' });
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

        // server says upgrade/payment needed
        if (res.status === 402) {
          dispatchShowModal('nh_show_upgrade_modal', { reason: 'reveals' });
          return;
        }

        result = await res.json();
        if (!res.ok) {
          throw new Error(result?.error || 'Reveal failed');
        }
      }

      // If server provided an authoritative updated usage object, persist it
      const serverUsage = result?.usage || (result && result.data && result.data.usage);
      if (serverUsage) {
        // ensure client state reflects server
        setClientSignedIn(email, serverUsage);
      } else {
        // fallback: increment local reveals
        try { incrementReveal(); } catch (e) { /* ignore */ }
      }

      // Save reveal record (non-authoritative local history)
      const record = {
        target,
        date: new Date().toISOString(),
        note: (result && result.data && result.data.note) || '',
      };
      try { recordReveal(record); } catch (e) { /* ignore */ }

      // Show result modal
      dispatchShowModal('nh_show_reveal_result', { data: result?.data || result });

      if (typeof onSuccess === 'function') onSuccess(result && result.data);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Reveal failed', err);
      dispatchShowModal('nh_show_reveal_result', { error: err.message || 'Reveal failed' });
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
