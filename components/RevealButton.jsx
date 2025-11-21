import React, { useEffect, useCallback } from 'react';
import Link from 'next/link';

/**
 * RevealButton — uses Link for internal navigation and ensures proper useEffect dependencies.
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
    return () => {};
  }, [doRevealInternal]);

  return (
    <Link href={to}>
      <a onClick={() => {
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
