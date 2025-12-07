/**
 * GlobalRevealInterceptor
 *
 * - Intercepts legacy "Reveal" clicks (buttons/anchors) and also listens for the
 *   custom 'nh_inline_reveal' event dispatched by SearchClient.
 * - Calls /api/find-company?domain=... to obtain reveal data (safe, reuses existing API).
 * - If server replies 402/403 it prompts the user (no automatic redirect).
 * - On success it shows the revealed email via confirm()/alert() and dispatches
 *   the 'usage-updated' event so the Header refreshes counters immediately.
 *
 * This keeps UI changes minimal and avoids adding complex DOM overlays (avoids CSP issues).
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
            const go = confirm('Revealing requires upgrading your plan. View plans?');
            if (go) window.location.href = '/plans';
            return;
          }
          const txt = await res.text().catch(() => '');
          alert('Reveal failed: ' + (txt || `status ${res.status}`));
          return;
        }
        const json = await res.json().catch(() => null);

        // try to find the contact email:
        let email = null;
        if (maybeContact && maybeContact.email) {
          // server might already include the email for that contact
          email = maybeContact.email;
        }
        // attempt to locate matching contact by index, name, or domain lists
        if (!email && maybeContact && typeof maybeContact.idx === 'number' && Array.isArray(json.contacts)) {
          const c = json.contacts[maybeContact.idx];
          if (c) email = c.email || c.revealedEmail || null;
        }
        if (!email && maybeContact && maybeContact.first_name) {
          const candidates = (json.contacts || []).filter(c => {
            const fn = (c.first_name || '').trim().toLowerCase();
            const ln = (c.last_name || '').trim().toLowerCase();
            return fn === (maybeContact.first_name || '').trim().toLowerCase() && (maybeContact.last_name ? ln === (maybeContact.last_name || '').trim().toLowerCase() : true);
          });
          if (candidates.length) email = candidates[0].email || candidates[0].revealedEmail || null;
        }
        // fallback: if json.email or json.revealedEmail exist at top-level
        if (!email && json) {
          email = json.email || json.revealedEmail || json.result?.email || null;
        }

        if (!email) {
          // succeeded but didn't find an email — still notify and update usage
          alert('Reveal completed but no email returned.');
          window.dispatchEvent(new CustomEvent('usage-updated'));
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

        // notify header and other components to refresh usage counts
        window.dispatchEvent(new CustomEvent('usage-updated'));
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

      const domain = inferDomainFromElement(anchor);
      // If domain cannot be inferred, try to find a nearby input[name=domain]
      let domainToUse = domain;
      if (!domainToUse) {
        try {
          const form = anchor.closest && anchor.closest('form');
          if (form) {
            const inp = form.querySelector && (form.querySelector('input[name="domain"]') || form.querySelector('input[data-role="domain"]') || form.querySelector('input[name="q"]'));
            if (inp) domainToUse = inp.value;
          }
        } catch (e) {}
      }

      // may pass a contact selector (not available here)
      await doRevealForDomain(domainToUse, null);
    }

    function handleInlineRevealEvent(e) {
      // e.detail should include { domain, idx, contact } as provided by SearchClient
      const detail = e && e.detail ? e.detail : null;
      const domain = detail?.domain || null;
      const maybeContact = { idx: typeof detail?.idx === 'number' ? detail.idx : undefined, first_name: detail?.contact?.first_name, last_name: detail?.contact?.last_name, email: detail?.contact?.email };
      doRevealForDomain(domain, maybeContact);
    }

    // Listen for search form submissions to refresh usage (kept for legacy flows)
    function handleSubmit(e) {
      const form = e.target;
      try {
        const hasDomain = !!(form.querySelector && (form.querySelector('input[name="domain"]') || form.querySelector('input[name="q"]') || form.querySelector('input[data-role="domain"]')));
        if (hasDomain) {
          setTimeout(() => window.dispatchEvent(new CustomEvent('usage-updated')), 1000);
        }
      } catch (err) {}
    }

    document.addEventListener('click', handleClick, true);
    document.addEventListener('submit', handleSubmit, true);
    window.addEventListener('nh_inline_reveal', handleInlineRevealEvent);

    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('submit', handleSubmit, true);
      window.removeEventListener('nh_inline_reveal', handleInlineRevealEvent);
    };
  }, []);

  return null;
}
