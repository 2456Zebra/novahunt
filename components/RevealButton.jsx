import React, { useState } from 'react';
import { canUseReveal, useReveal } from './UsageEnforcer';

/*
RevealButton
- Replace your existing reveal buttons with this component (or use same logic).
- Props:
  - onReveal: function to run when reveal is allowed (e.g., open reveal UI, show email)
  - label: optional button label
- Behavior:
  - If the user's reveal quota is available, increments the used reveals and calls onReveal.
  - If quota exceeded, shows an upgrade prompt (simple alert; replace with modal or link).
*/

export default function RevealButton({ onReveal, label = 'Reveal' }) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (!canUseReveal(1)) {
        // Out of reveals — prompt upgrade
        const go = window.confirm('You have reached your reveal limit for this plan. Upgrade to reveal more. Go to Plans?');
        if (go) window.location.href = '/plans';
        return;
      }

      const ok = useReveal(1);
      if (!ok) {
        const go = window.confirm('You have reached your reveal limit for this plan. Upgrade to reveal more. Go to Plans?');
        if (go) window.location.href = '/plans';
        return;
      }

      if (typeof onReveal === 'function') {
        await onReveal();
      } else {
        // default reveal behavior placeholder if none provided
        alert('Revealed (demo).');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      style={{
        padding: '6px 10px',
        borderRadius: 6,
        border: '1px solid #e6e6e6',
        background: '#fff',
        cursor: 'pointer',
        fontWeight: 700,
      }}
    >
      {busy ? 'Working…' : label}
    </button>
  );
}
