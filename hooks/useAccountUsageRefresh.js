// Call this hook on the dashboard page (or _app.js) to force account-usage re-fetch on mount.
// It stores the result in sessionStorage and dispatches a global event 'account-usage-updated' so other components update.
import { useEffect } from 'react';

export default function useAccountUsageRefresh() {
  useEffect(() => {
    async function refresh() {
      try {
        const res = await fetch('/api/account-usage', { method: 'GET', credentials: 'same-origin' });
        if (!res.ok) return;
        const json = await res.json();
        try {
          sessionStorage.setItem('account_usage', JSON.stringify(json));
        } catch (_) { /* ignore */ }
        // Dispatch a global event so HeaderAuth and other components can update
        window.dispatchEvent(new Event('account-usage-updated'));
      } catch (e) {
        // ignore
      }
    }

    // run once on mount
    refresh();

    // Optionally refresh again after a short delay to account for eventual consistency
    const timeout = setTimeout(refresh, 1500);
    return () => clearTimeout(timeout);
  }, []);
}
