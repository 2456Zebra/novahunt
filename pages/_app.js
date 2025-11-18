import { useEffect } from 'react';

function normalizeText(s) {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .replace(/[\u00A0]/g, ' ')
    .trim()
    .toLowerCase();
}

function pseudoContent(el, pseudo) {
  try {
    const v = window.getComputedStyle(el, pseudo).getPropertyValue('content') || '';
    // remove surrounding quotes browsers put around content()
    return v.replace(/^["']?(.*)["']?$/,'$1');
  } catch (e) {
    return '';
  }
}

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    const TARGET_PREFIX = 'sign in to see all';
    const ABS_URL = 'https://www.novahunt.ai/signin';

    function looksLikeSignInCTAText(s) {
      if (!s) return false;
      const n = normalizeText(s);
      if (!n) return false;
      if (n === 'sign in' || n.startsWith(TARGET_PREFIX)) return true;
      if (n.includes('sign in') && (n.includes('see all') || n.includes('see all results'))) return true;
      return false;
    }

    function findMatchingAncestorFromPoint(x, y) {
      try {
        let el = document.elementFromPoint(x, y);
        for (let i = 0; i < 8 && el; i++) {
          // 1) check visible text
          if (looksLikeSignInCTAText(el.innerText || el.textContent)) return el;
          // 2) check common attributes
          const attrs = ['aria-label','title','alt','placeholder','data-title','data-text'];
          for (const a of attrs) {
            const v = el.getAttribute && el.getAttribute(a);
            if (v && looksLikeSignInCTAText(v)) return el;
          }
          // 3) check pseudo elements ::before / ::after
          const before = pseudoContent(el, '::before');
          const after = pseudoContent(el, '::after');
          if (looksLikeSignInCTAText(before) || looksLikeSignInCTAText(after)) return el;
          // 4) check SVG/text content
          if (el.namespaceURI && el.namespaceURI.includes('svg')) {
            if (looksLikeSignInCTAText(el.textContent)) return el;
          }
          el = el.parentElement;
        }
      } catch (e) {}
      return null;
    }

    function onCaptureClick(e) {
      try {
        // prefer clientX/Y (touch events may differ)
        const x = (e.touches && e.touches[0] && e.touches[0].clientX) || e.clientX || 0;
        const y = (e.touches && e.touches[0] && e.touches[0].clientY) || e.clientY || 0;
        const el = findMatchingAncestorFromPoint(x, y);
        if (el) {
          e.preventDefault();
          e.stopImmediatePropagation && e.stopImmediatePropagation();
          // Force absolute redirect to the site signin page requested
          window.location.href = ABS_URL;
        }
      } catch (err) {
        // ignore
      }
    }

    function onKeyDown(e) {
      try {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const el = document.activeElement;
        if (el && looksLikeSignInCTAText(el.innerText || el.textContent || el.getAttribute && el.getAttribute('aria-label'))) {
          e.preventDefault();
          window.location.href = ABS_URL;
        }
      } catch (err) {}
    }

    document.addEventListener('click', onCaptureClick, true); // capture phase
    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('click', onCaptureClick, true);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, []);

  return <Component {...pageProps} />;
}
