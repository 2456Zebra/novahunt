import React, { useState } from 'react';

/*
  Defensive UpgradeButton:
  - Accepts priceId and email props
  - If priceId missing, tries to read data-plan-price-id from the button/closest ancestor
  - Logs exactly what is being sent to the server so you can see why the server returned "Missing priceId"
  - Keeps friendly UI and error messages
*/

export default function UpgradeButton({ priceId: propPriceId, email, label = 'Upgrade' }) {
  const [loading, setLoading] = useState(false);

  const findPriceIdFromDom = (el) => {
    if (!el) return null;
    // walk up to find data-plan-price-id
    let cur = el;
    while (cur && cur !== document.body) {
      if (cur.dataset && cur.dataset.planPriceId) return cur.dataset.planPriceId;
      cur = cur.parentElement;
    }
    return null;
  };

  const startCheckout = async (e) => {
    setLoading(true);

    try {
      // Prefer prop, then dataset on button/ancestors
      const domPriceId = findPriceIdFromDom(e && e.currentTarget ? e.currentTarget : e && e.target);
      const priceId = propPriceId || domPriceId || null;

      console.info('UpgradeButton.startCheckout: priceId prop=', propPriceId, 'domPriceId=', domPriceId);

      if (!priceId || typeof priceId !== 'string') {
        console.error('UpgradeButton: missing or invalid priceId', { propPriceId, domPriceId });
        alert('Configuration error: price not available. Please contact support.');
        setLoading(false);
        return;
      }

      const payload = { priceId, email };
      console.info('UpgradeButton: sending payload to /api/create-checkout-session', payload);

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch (_) { /* ignore */ }

      if (!res.ok) {
        console.error('create-checkout-session failed', res.status, text);
        alert(`Could not start checkout: ${json && (json.error || json.message) ? (json.error || json.message) : res.statusText}`);
        setLoading(false);
        return;
      }

      if (json && json.url) {
        window.location.href = json.url;
      } else {
        console.error('Unexpected response from create-checkout-session', text);
        alert('Could not start checkout: unexpected server response.');
        setLoading(false);
      }
    } catch (err) {
      console.error('UpgradeButton error', err);
      alert('Could not start checkout. Try again.');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={startCheckout}
      disabled={loading}
      data-plan-price-id={propPriceId || ''}
      className="upgrade-button"
      aria-busy={loading}
    >
      {loading ? 'Starting…' : label}
    </button>
  );
}
