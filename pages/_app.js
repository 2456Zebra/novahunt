import { useEffect } from 'react';
import Header from '../components/Header'; // ensures header is shown on every page
// If your project uses a global CSS file, keep this import (uncomment if present in your repo)
// import '../styles/globals.css';

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
          if (looksLikeSignInCTAText(el.innerText || el.textContent)) return el;
          const attrs = ['aria-label','title','alt','placeholder','data-title','data-text'];
          for (const a of attrs) {
            const v = el.getAttribute && el.getAttribute(a);
            if (v && looksLikeSignInCTAText(v)) return el;
          }
          const before = pseudoContent(el, '::before');
          const after = pseudoContent(el, '::after');
          if (looksLikeSignInCTAText(before) || looksLikeSignInCTAText(after)) return el;
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
        const x = (e.touches && e.touches[0] && e.touches[0].clientX) || e.clientX || 0;
        const y = (e.touches && e.touches[0] && e.touches[0].clientY) || e.clientY || 0;
        const el = findMatchingAncestorFromPoint(x, y);
        if (el) {
          e.preventDefault();
          e.stopImmediatePropagation && e.stopImmediatePropagation();
          window.location.href = ABS_URL;
        }
      } catch (err) {}
    }

    function onKeyDown(e) {
      try {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const el = document.activeElement;
        if (el && looksLikeSignInCTAText(el.innerText || el.textContent || (el.getAttribute && el.getAttribute('aria-label')))) {
          e.preventDefault();
          window.location.href = ABS_URL;
        }
      } catch (err) {}
    }

    document.addEventListener('click', onCaptureClick, true);
    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('click', onCaptureClick, true);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, []);

  return (
    <>
      <Header />
      <Component {...pageProps} />
    </>
  );
}
