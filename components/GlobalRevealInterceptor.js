/**
 * GlobalRevealInterceptor
 *
 * - Installed from pages/_app for authenticated users.
 * - Captures clicks (in the capture phase) on elements that look like "Reveal" triggers:
 *   - elements with data-action="reveal"
 *   - elements with data-reveal (domain) attribute
 *   - elements with class "reveal" or "js-reveal"
 * - Prevents default navigation, calls /api/find-company?domain=... and shows a simple alert with the revealed email.
 * - Dispatches a 'usage-updated' CustomEvent so Header refreshes counters immediately.
 *
 * This is intentionally conservative and uses native alert() to avoid adding complex UI that might conflict with your CSP.
 */
import { useEffect } from 'react';

function findRevealAnchor(el) {
  if (!el) return null;
  const a = el.closest && el.closest('[data-action="reveal"], [data-reveal], .reveal, .js-reveal');
  return a || null;
}

export default function GlobalRevealInterceptor() {
  useEffect(() => {
    async function handleClick(e) {
      // only handle left click without modifiers
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const el = e.target;
      const anchor = findRevealAnchor(el);
      if (!anchor) return;

      // Found an element that intends to trigger a reveal
      try {
        // prevent default navigation / other handlers
        e.preventDefault();
        e.stopImmediatePropagation();
      } catch (err) {
        try { e.preventDefault(); e.stopPropagation(); } catch (_) {}
      }

      // attempt to infer domain:
      // - data-reveal="domain.com"
      // - data-domain="domain.com"
      // - data-action-param or href query param ?domain=
      let domain = anchor.getAttribute('data-reveal') || anchor.getAttribute('data-domain') || anchor.dataset.reveal || anchor.dataset.domain || null;

      // if anchor has href with domain query param, try to parse
      if (!domain && anchor.href) {
        try {
          const u = new URL(anchor.href, window.location.href);
          domain = u.searchParams.get('domain') || u.searchParams.get('q') || null;
        } catch (err) {
          // ignore
        }
      }

      // Fallback: try to find a nearby input[name="domain"] or input[data-role="domain"]
      if (!domain) {
        const form = anchor.closest && anchor.closest('form');
        if (form) {
          const inp = form.querySelector && (form.querySelector('input[name="domain"]') || form.querySelector('input[data-role="domain"]'));
          if (inp) domain = inp.value || null;
        }
      }

      if (!domain) {
        // If we can't infer a domain, notify and allow original behavior
        // but we prevented propagation — just show a message and return
        alert('Reveal: could not infer domain to reveal. If this is part of the site, please update the element to include data-reveal="<domain>".');
        return;
      }

      // Show a loading indicator using alert (simple)
      try {
        // call find-company endpoint
        const findUrl = `/api/find-company?domain=${encodeURIComponent(domain)}`;
        const res = await fetch(findUrl, { credentials: 'same-origin' });
        if (!res.ok) {
          if (res.status === 402 || res.status === 403) {
            const go = confirm('Reveal requires an upgrade. Do you want to view plans?');
            if (go) window.location.href = '/plans';
            return;
          }
          const txt = await res.text().catch(() => '');
          alert('Reveal failed: ' + (txt || `status ${res.status}`));
          return;
        }
        const json = await res.json().catch(() => null);
        const email = (json && (json.email || json.revealedEmail || json.result?.email)) || null;
        if (!email) {
          alert('Reveal successful but no email returned.');
          // still dispatch usage update so counters increment if server incremented
          window.dispatchEvent(new CustomEvent('usage-updated'));
          return;
        }

        // show the revealed email
        // Offer to save via a confirm prompt (simple)
        const save = confirm(`Revealed: ${email}\n\nSave this contact to your account?`);
        if (save) {
          try {
            await fetch('/api/save-contact', {
              method: 'POST',
              credentials: 'same-origin',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ domain, email }),
            });
            alert('Saved ✓');
          } catch (err) {
            alert('Save failed (network). The reveal succeeded.');
          }
        }

        // notify any listeners to refresh usage
        window.dispatchEvent(new CustomEvent('usage-updated'));
      } catch (err) {
        console.error('GlobalRevealInterceptor error', err);
        alert('Reveal failed: ' + String(err && err.message ? err.message : err));
      }
    }

    document.addEventListener('click', handleClick, true); // capture phase
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  return null;
}
