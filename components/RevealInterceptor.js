/**
 * RevealInterceptor
 *
 * Temporary client-side safeguard to:
 * - Block automatic navigation to /plans (both links and JS-driven).
 * - Show a small non-blocking banner when a navigation to /plans is blocked so you can inspect network calls.
 *
 * Usage:
 * - Upload this file to components/RevealInterceptor.js
 * - Import and render it inside pages/_app.js (only when authenticated) so it runs on client pages.
 *
 * This is intentionally conservative: it does NOT change any reveal logic or server behavior.
 * It simply prevents the app from taking you to /plans automatically so you can capture the reveal XHR and the server response.
 */

import { useEffect, useState } from 'react';

export default function RevealInterceptor() {
  const [blockedCount, setBlockedCount] = useState(0);

  useEffect(() => {
    // Block clicks on <a> elements pointing to /plans
    function onClick(e) {
      const a = e.target.closest && e.target.closest('a');
      if (!a) return;
      try {
        const href = a.getAttribute('href') || a.href || '';
        // If link points to /plans (relative or absolute), block
        if (href && (href === '/plans' || href.endsWith('/plans') || href.includes('/plans'))) {
          e.preventDefault();
          e.stopPropagation();
          console.log('[RevealInterceptor] Blocked link navigation to /plans', href);
          setBlockedCount((c) => c + 1);
        }
      } catch (err) {
        // ignore
      }
    }

    // Block window.location.assign/replace to /plans
    const origAssign = window.location.assign.bind(window.location);
    const origReplace = window.location.replace.bind(window.location);
    function safeAssign(u) {
      try {
        const s = String(u || '');
        if (s.includes('/plans')) {
          console.log('[RevealInterceptor] Blocked location.assign to', s);
          setBlockedCount((c) => c + 1);
          return;
        }
      } catch (err) {}
      return origAssign(u);
    }
    function safeReplace(u) {
      try {
        const s = String(u || '');
        if (s.includes('/plans')) {
          console.log('[RevealInterceptor] Blocked location.replace to', s);
          setBlockedCount((c) => c + 1);
          return;
        }
      } catch (err) {}
      return origReplace(u);
    }

    // Install handlers
    document.addEventListener('click', onClick, true);
    window.location.assign = safeAssign;
    window.location.replace = safeReplace;

    // Restore on unmount
    return () => {
      document.removeEventListener('click', onClick, true);
      try {
        window.location.assign = origAssign;
        window.location.replace = origReplace;
      } catch (e) {}
    };
  }, []);

  // Small banner UI — fixed at top-right — non-intrusive
  return (
    <div aria-hidden style={{
      position: 'fixed',
      top: 12,
      right: 12,
      zIndex: 9999,
      pointerEvents: 'none',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    }}>
      {blockedCount > 0 && (
        <div style={{
          pointerEvents: 'auto',
          background: 'rgba(18,183,106,0.95)',
          color: '#fff',
          padding: '6px 10px',
          borderRadius: 8,
          boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
          fontSize: 13,
          fontWeight: 600,
        }}>
          Blocked {blockedCount} automatic /plans navigation — check Network tab
        </div>
      )}
    </div>
  );
}
