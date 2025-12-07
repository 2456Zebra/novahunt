/**
 * GlobalRevealInterceptor
 *
 * - Intercepts legacy Reveal clicks and listens for 'nh_inline_reveal' custom events from SearchClient.
 * - Falls back to the last searched domain (written by SearchClient to window.__nh_last_domain and localStorage).
 * - Calls /api/find-company?domain=... and dispatches 'usage-updated' and writes localStorage markers so Header updates immediately.
 */
import { useEffect } from 'react';

function findRevealAnchor(el) {
  if (!el) return null;
  const a = el.closest && el.closest('[data-action="reveal"], [data-reveal], [data-domain], .reveal, .js-reveal, .btn-reveal, [aria-label="reveal"]');
  if (a) return a;
  const btn = el.closest && el.closest('button, a, [role="button"]');
  if (btn) {
    try {
      const text = (btn.textContent || '').trim().toLowerCase();
      if (text === 'reveal' || text.startsWith('reveal') || text.includes(' reveal')) return btn;
    } catch (err) {}
  }
  return null;
}

function inferDomainFromElement(anchor) {
  try {
    const explicit = anchor.getAttribute && (anchor.getAttribute('data-reveal') || anchor.getAttribute('data-domain')) || (anchor.dataset && (anchor.dataset.reveal || anchor.dataset.domain));
    if (explicit) return explicit;
    if (anchor.href) {
      const u = new URL(anchor.href, window.location.href);
      return u.searchParams.get('domain') || u.searchParams.get('q') || null;
    }
  } catch (e) {}
  return null;
}

function getLastDomainFallback() {
  // primary: window variable written by SearchClient
  if (typeof window !== 'undefined' && window.__nh_last_domain) return window.__nh_last_domain;
  try {
    const ls = localStorage.getItem('nh_last_domain');
    if (ls) return ls;
  } catch (e) {}
  return null;
}

export default function GlobalRevealInterceptor() {
  useEffect(() => {
    async function doRevealForDomain(domain, maybeContact) {
      if (!domain) {
        alert('Reveal: missing domain value');
        return;
      }
      try {
        const findUrl = `/api/find-company?domain=${encodeURIComponent(domain)}`;
        const res = await fetch(findUrl, { credentials: 'same-origin' });
        if (!res.ok) {
          if (res.status === 402 || res.status === 403) {
            const go = confirm('Revealing this contact requires upgrading your plan. View plans?');
            if (go) window.location.href = '/plans';
            return;
          }
          const txt = await res.text().catch(() => '');
          alert('Reveal failed: ' + (txt || `status ${res.status}`));
          return;
        }
        const json = await res.json().catch(() => null);

        const email = (maybeContact && maybeContact.email) ||
                      (maybeContact && typeof maybeContact.idx === 'number' && json?.contacts?.[maybeContact.idx]?.email) ||
                      json?.email || json?.revealedEmail || json?.result?.email || null;

        if (!email) {
          alert('Reveal completed but no email returned.');
          // mark usage updated (server may have incremented)
          try {
            window.dispatchEvent(new CustomEvent('usage-updated'));
            localStorage.setItem('nh_usage_last_update', String(Date.now()));
          } catch (e) {}
          return;
        }

        const save = confirm(`Revealed: ${email}\n\nSave this contact to your account?`);
        if (save) {
          try {
            const saveRes = await fetch('/api/save-contact', {
              method: 'POST',
              credentials: 'same-origin',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ domain, email }),
            });
            if (!saveRes.ok) {
              const txt = await saveRes.text().catch(() => '');
              alert('Save failed: ' + (txt || `status ${saveRes.status}`));
            } else {
              alert('Saved ✓');
            }
          } catch (err) {
            alert('Save failed (network). The reveal succeeded.');
          }
        }

        // notify header & other listeners to refresh usage immediately
        try {
          window.dispatchEvent(new CustomEvent('usage-updated'));
          localStorage.setItem('nh_usage_last_update', String(Date.now()));
        } catch (e) {}
      } catch (err) {
        console.error('GlobalRevealInterceptor.doReveal error', err);
        alert('Reveal error: ' + String(err && err.message ? err.message : err));
      }
    }

    async function handleClick(e) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const el = e.target;
      const anchor = findRevealAnchor(el);
      if (!anchor) return;

      try {
        e.preventDefault();
        e.stopImmediatePropagation();
      } catch (err) {
        try { e.preventDefault(); e.stopPropagation(); } catch (_) {}
      }

      let domain = inferDomainFromElement(anchor);
      if (!domain) domain = getLastDomainFallback();

      await doRevealForDomain(domain, null);
    }

    function handleInlineRevealEvent(e) {
      const detail = e && e.detail ? e.detail : null;
      const domain = detail?.domain || getLastDomainFallback();
      const contact = detail?.contact || (typeof detail?.idx === 'number' ? { idx: detail.idx } : null);
      doRevealForDomain(domain, contact);
    }

    document.addEventListener('click', handleClick, true);
    window.addEventListener('nh_inline_reveal', handleInlineRevealEvent);

    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('nh_inline_reveal', handleInlineRevealEvent);
    };
  }, []);

  return null;
}
