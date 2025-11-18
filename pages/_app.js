import { useEffect } from 'react';

function textMatchesSignInCandidate(s) {
  if (!s) return false;
  const t = String(s).trim().toLowerCase();
  return t.startsWith('sign in to see all') || t === 'sign in' || t.startsWith('sign in to see all results');
}

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Capture-phase click listener so it runs before other handlers.
    function onCaptureClick(e) {
      try {
        let el = e.target;
        // walk up a few levels to check container nodes (limit to avoid infinite loops)
        for (let i = 0; i < 6 && el; i++, el = el.parentElement) {
          const txt = (el.innerText || '').trim();
          if (textMatchesSignInCandidate(txt)) {
            // Prevent other handlers and redirect
            e.preventDefault();
            e.stopImmediatePropagation?.();
            window.location.href = '/signin';
            return;
          }
        }
      } catch (err) {
        // ignore any unexpected errors
      }
    }

    // Also provide keyboard support for Enter / Space via global keydown when focused
    function onKeyDown(e) {
      try {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        let el = document.activeElement;
        for (let i = 0; i < 6 && el; i++, el = el.parentElement) {
          const txt = (el.innerText || '').trim();
          if (textMatchesSignInCandidate(txt)) {
            e.preventDefault();
            window.location.href = '/signin';
            return;
          }
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

  return <Component {...pageProps} />;
}
