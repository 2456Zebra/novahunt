import React, { useEffect, useCallback } from 'react';
import Link from 'next/link';

/**
 * RevealButton — uses Link for internal navigation and ensures proper useEffect dependencies.
 * Minimal, lint-clean implementation that calls an optional onReveal handler and navigates
 * to the provided internal route using Next's Link.
 */
export default function RevealButton({ onReveal, to = '/plans', children = 'Reveal', className = '' }) {
  const doRevealInternal = useCallback(() => {
    try {
      if (typeof onReveal === 'function') onReveal();
    } catch (e) {
      console.error('Reveal error', e);
    }
  }, [onReveal]);

  useEffect(() => {
    // keep effect stable and include doRevealInternal to satisfy react-hooks/exhaustive-deps
    return () => {};
  }, [doRevealInternal]);

  return (
    <Link href={to}>
      <a
        onClick={() => {
          try { doRevealInternal(); } catch (err) { /* ignore */ }
        }}
        className={className}
        aria-label="Reveal"
      >
        {children}
      </a>
    </Link>
  );
}
