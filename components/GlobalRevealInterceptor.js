/**
 * GlobalRevealInterceptor
 *
 * - Listens for nh_inline_reveal custom events (legacy SearchClient Reveal dispatch).
 * - Falls back to the last searched domain from window.__nh_last_domain or localStorage 'nh_last_domain'.
 * - Calls /api/find-company?domain=... and shows the revealed email via confirm/alert.
 * - Writes a localStorage marker (nh_usage_last_update) and dispatches 'nh_usage_updated' so your AccountMenu updates immediately.
 *
 * This is conservative and mirrors the older working behavior you provided.
 */
import { useEffect } from 'react';

function getLastDomainFallback() {
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
          try {
            window.dispatchEvent(new CustomEvent('nh_usage_updated'));
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

        try {
          window.dispatchEvent(new CustomEvent('nh_usage_updated'));
          localStorage.setItem('nh_usage_last_update', String(Date.now()));
        } catch (e) {}
      } catch (err) {
        console.error('GlobalRevealInterceptor.doReveal error', err);
        alert('Reveal error: ' + String(err && err.message ? err.message : err));
      }
    }

    function handleInlineRevealEvent(e) {
      const detail = e && e.detail ? e.detail : null;
      const domain = detail?.domain || getLastDomainFallback();
      const contact = detail?.contact || (typeof detail?.idx === 'number' ? { idx: detail.idx } : null);
      doRevealForDomain(domain, contact);
    }

    window.addEventListener('nh_inline_reveal', handleInlineRevealEvent);
    return () => window.removeEventListener('nh_inline_reveal', handleInlineRevealEvent);
  }, []);

  return null;
}
