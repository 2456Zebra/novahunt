/**
 * GlobalRevealInterceptor
 *
 * - Listens for nh_inline_reveal and does reveal+save flows.
 * - When a save succeeds, persist the saved contact to localStorage 'nh_saved_contacts' (fallback)
 *   and dispatch 'nh_saved_contact' + set 'nh_saved_contacts_last_update' marker so Account reads it.
 *
 * This ensures saved reveals are visible on Account even if the backend doesn't persist them (demo mode).
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

function persistLocalSaved(domain, email, extras = {}) {
  try {
    const raw = localStorage.getItem('nh_saved_contacts') || '[]';
    const arr = JSON.parse(raw);
    const item = { domain, email, created_at: new Date().toISOString(), ...extras };
    arr.unshift(item);
    localStorage.setItem('nh_saved_contacts', JSON.stringify(arr.slice(0, 200))); // cap
    localStorage.setItem('nh_saved_contacts_last_update', String(Date.now()));
    try { window.dispatchEvent(new CustomEvent('nh_saved_contact', { detail: item })); } catch (e) {}
  } catch (e) {
    console.error('persistLocalSaved error', e);
  }
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
          let savedOk = false;
          try {
            const saveRes = await fetch('/api/save-contact', {
              method: 'POST',
              credentials: 'same-origin',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ domain, email }),
            });
            if (saveRes && (saveRes.status === 200 || saveRes.status === 201 || saveRes.status === 204)) {
              savedOk = true;
            } else {
              // try alternate endpoints
              const alt = ['/api/save-saved-contact', '/api/saved-contacts'];
              for (const url of alt) {
                try {
                  const r2 = await fetch(url, {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ domain, email }),
                  });
                  if (r2 && (r2.status === 200 || r2.status === 201 || r2.status === 204)) { savedOk = true; break; }
                } catch (e) {}
              }
            }
          } catch (err) {
            console.warn('save contact network error', err);
          }

          // Always persist locally as fallback so Account page can show saved reveals in demo environments
          persistLocalSaved(domain, email, { source: 'client-fallback' });

          if (savedOk) {
            alert('Saved ✓');
          } else {
            alert('Saved locally (server save may not be available).');
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
