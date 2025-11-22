import React, { useCallback, useEffect } from 'react';
import Link from 'next/link';

/**
 * RevealButton — stable, lint-clean. For unauthenticated users it navigates to plans.
 */
export default function RevealButton({ onReveal, to = '/plans', children = 'Reveal', className = '' }) {
  const doRevealInternal = useCallback(() => {
    try { if (typeof onReveal === 'function') onReveal(); } catch (e) { /* ignore */ }
  }, [onReveal]);

  useEffect(() => {
    // ensure lint happy
    return () => {};
  }, [doRevealInternal]);

  return (
    <Link href={to}>
      <a
        onClick={() => { try { doRevealInternal(); } catch (e) {} }}
        className={className}
        aria-label="Reveal"
        style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 6, background: '#2563eb', color: '#fff', textDecoration: 'none', fontSize: 13 }}
      >
        {children}
      </a>
    </Link>
  );
}
