import React, { useState } from 'react';

/*
  UpgradeButton (defensive)
  - Prefers prop priceId
  - Falls back to data-price-id, data-product, or data-plan (in that order)
  - Sends plan/product/price to API so the server can resolve priceId using env mappings
  - Usage:
    <UpgradeButton priceId={plan.price?.id} email={user?.email} label="Subscribe" />
    or
    <button data-plan="pro" data-product="prod_ABC..." className="upgrade-button">Subscribe</button>
*/

export default function UpgradeButton({ priceId: propPriceId, email, label = 'Upgrade' }) {
  const [loading, setLoading] = useState(false);

  const startCheckout = async (e) => {
    setLoading(true);
    try {
      const btn = (e && e.currentTarget) || (e && e.target) || null;
      const domPrice = btn && btn.dataset && (btn.dataset.priceId || btn.dataset.price);
      const domProduct = btn && btn.dataset && btn.dataset.product;
      const domPlan = btn && btn.dataset && btn.dataset.plan;

      const payload = {};
      if (propPriceId) payload.priceId = propPriceId;
      else if (domPrice) payload.priceId = domPrice;
      else if (domProduct) payload.productId = domProduct;
      else if (domPlan) payload.plan = domPlan;

      if (email) payload.email = email;

      console.info('UpgradeButton: outgoing payload', payload);

      if (!payload.priceId && !payload.productId && !payload.plan) {
        console.error('UpgradeButton: no price/product/plan available', payload);
        alert('Pricing configuration missing. Please contact support.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch (_) {}

      if (!res.ok) {
        console.error('create-checkout-session failed', res.status, text);
        const message = (json && (json.error || json.message)) || 'Could not start checkout. Try again.';
        // Show diagnostics-friendly message
        alert(`Could not start checkout: ${message}`);
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
      data-price-id={propPriceId || ''}
      className="upgrade-button"
      aria-busy={loading}
    >
      {loading ? 'Starting…' : label}
    </button>
  );
}
