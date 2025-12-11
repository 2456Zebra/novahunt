// Small helper that notifies the account page (and auto-refreshes it) when saved reveals or usage updates occur.
//
// Usage: import and render <AccountSavedUpdater /> somewhere on your Account page (or globally in _app if you prefer).
// For quick rollout I recommend adding it to pages/account.js so the account page automatically refreshes when a
// new saved contact is added.
import { useEffect } from 'react';

export default function AccountSavedUpdater({ autoReloadOnAccount = true }) {
  useEffect(() => {
    let reloadTimer = null;

    function notify() {
      // set localStorage marker so other tabs/components can see it
      try {
        localStorage.setItem('nh_saved_contacts_last_update', String(Date.now()));
      } catch (e) {}
      // dispatch a custom event so any in-page listeners can update without reload
      try {
        window.dispatchEvent(new CustomEvent('nh_saved_contact'));
      } catch (e) {}

      // Optionally reload the account page if we're currently on it so saved items appear immediately
      try {
        if (autoReloadOnAccount && window.location && window.location.pathname === '/account') {
          if (reloadTimer) clearTimeout(reloadTimer);
          reloadTimer = setTimeout(() => {
            // soft reload to let the page fetch saved contacts fresh
            window.location.reload();
          }, 400);
        }
      } catch (e) {}
    }

    // events that should trigger a refresh
    const events = ['nh_saved_contact', 'nh_usage_updated', 'nh_saved_contacts_last_update'];
    function handler(e) { notify(); }

    events.forEach(ev => window.addEventListener(ev, handler));
    // Also listen to storage changes (other tabs)
    function storageHandler(e) {
      if (!e || !e.key) return;
      if (['nh_saved_contacts_last_update', 'nh_usage_last_update'].includes(e.key)) {
        notify();
      }
    }
    window.addEventListener('storage', storageHandler);

    return () => {
      events.forEach(ev => window.removeEventListener(ev, handler));
      window.removeEventListener('storage', storageHandler);
      if (reloadTimer) clearTimeout(reloadTimer);
    };
  }, [autoReloadOnAccount]);

  return null;
}
