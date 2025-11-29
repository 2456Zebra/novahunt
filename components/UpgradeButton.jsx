import React, { useState } from 'react';

/*
  Defensive UpgradeButton
  - Accepts priceId and email props (preferred)
  - Falls back to data-plan-price-id on the button or nearest ancestor
  - Logs outgoing payload so you can inspect what is sent
  - Shows a loading state and friendly error messages
  - Usage: <UpgradeButton priceId={plan.price?.id || plan.priceId} email={user?.email} label="Subscribe" />
*/

export default function UpgradeButton({ priceId: propPriceId, email, label = 'Upgrade' }) {
  const [loading, setLoading] = useState(false);

  const findPriceIdFromDom = (el) => {
    if (!el) return null;
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
      const domPriceId = findPriceIdFromDom(e && e.currentTarget ? e.currentTarget : e && e.target);
      console.info('UpgradeButton.startCheckout: propPriceId=', propPriceId, 'domPriceId=', domPriceId);
      const priceId = propPriceId || domPriceId || null;

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
      try { json = JSON.parse(text); } catch (err) { /* not JSON */ }

      if (!res.ok) {
        const errMsg = (json && (json.error || json.message)) || res.statusText || 'Could not start checkout';
        console.error('create-checkout-session failed', res.status, text);
        alert(`Could not start checkout: ${errMsg}`);
        setLoading(false);
        return;
      }

      if (json && json.url) {
        // Redirect to Stripe Checkout
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
