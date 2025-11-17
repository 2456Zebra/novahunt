// Simple client-side tracker helper for NovaHunt
// Usage:
//   include <script src="/track.js"></script> in your public HTML

(function () {
  function getUserId() {
    try {
      return localStorage.getItem('nh_userId');
    } catch (e) {
      return null;
    }
  }

  function setUserId(id) {
    try {
      if (id) localStorage.setItem('nh_userId', id);
    } catch (e) {}
  }

  async function trackEvent({ eventType, payload = {}, userId = null }) {
    const uid = userId || getUserId();
    try {
      await fetch('/api/track-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, eventType, payload }),
      });
    } catch (e) {
      // swallow errors in client tracking
      console.warn('trackEvent failed', e && e.message ? e.message : e);
    }
  }

  // expose globally
  window.NovaHuntTracker = {
    trackEvent,
    setUserId,
    getUserId,
  };
})();