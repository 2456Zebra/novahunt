import { useEffect, useState } from 'react';
import styles from './RevealInterceptor.module.css';

/**
 * RevealInterceptor
 * - Prevents automatic navigation to /plans (clicks and JS assign/replace)
 * - Shows a small non-blocking banner when blocked
 */
export default function RevealInterceptor() {
  const [blockedCount, setBlockedCount] = useState(0);

  useEffect(() => {
    function onClick(e) {
      const a = e.target.closest && e.target.closest('a');
      if (!a) return;
      try {
        const href = a.getAttribute('href') || a.href || '';
        if (href && (href === '/plans' || href.endsWith('/plans') || href.includes('/plans'))) {
          e.preventDefault();
          e.stopPropagation();
          setBlockedCount((c) => c + 1);
          console.log('[RevealInterceptor] Blocked link navigation to /plans', href);
        }
      } catch (err) {
        // ignore
      }
    }

    const origAssign = window.location.assign.bind(window.location);
    const origReplace = window.location.replace.bind(window.location);

    function safeAssign(u) {
      try {
        const s = String(u || '');
        if (s.includes('/plans')) {
          setBlockedCount((c) => c + 1);
          console.log('[RevealInterceptor] Blocked location.assign to', s);
          return;
        }
      } catch (err) {}
      return origAssign(u);
    }
    function safeReplace(u) {
      try {
        const s = String(u || '');
        if (s.includes('/plans')) {
          setBlockedCount((c) => c + 1);
          console.log('[RevealInterceptor] Blocked location.replace to', s);
          return;
        }
      } catch (err) {}
      return origReplace(u);
    }

    document.addEventListener('click', onClick, true);
    window.location.assign = safeAssign;
    window.location.replace = safeReplace;

    return () => {
      document.removeEventListener('click', onClick, true);
      try {
        window.location.assign = origAssign;
        window.location.replace = origReplace;
      } catch (e) {}
    };
  }, []);

  return (
    <div className={styles.wrap} aria-hidden>
      {blockedCount > 0 && (
        <div className={styles.banner}>
          Blocked {blockedCount} automatic /plans navigation — check Network tab
        </div>
      )}
    </div>
  );
}
