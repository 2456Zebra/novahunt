import React, { useState } from 'react';

/*
  UpgradeButton
  - Preferred: pass priceId prop
  - Fallbacks: plan slug or productId in data attributes or props are supported by server handler
  - Usage examples:
    <UpgradeButton priceId={plan.price?.id} email={user?.email} label="Subscribe" />
    <UpgradeButton label="Pro" data-plan="pro" />
*/

export default function UpgradeButton({ priceId: propPriceId, email, label = 'Upgrade', 'data-plan': dataPlan, 'data-product': dataProduct }) {
  const [loading, setLoading] = useState(false);

  const startCheckout = async (e) => {
    setLoading(true);
    try {
      // Prefer priceId prop; otherwise pick up dataset attributes on the button
      const btn = e && e.currentTarget ? e.currentTarget : null;
      const domPlan = btn && btn.dataset && btn.dataset.plan;
      const domProduct = btn && btn.dataset && btn.dataset.product;
      const domPrice = btn && btn.dataset && btn.dataset.priceId;

      const payload = {};
      if (propPriceId) payload.priceId = propPriceId;
      else if (domPrice) payload.priceId = domPrice;
      else if (dataPlan || domPlan) payload.plan = dataPlan || domPlan;
      else if (dataProduct || domProduct) payload.productId = dataProduct || domProduct;

      if (email) payload.email = email;

      console.info('UpgradeButton: payload', payload);

      if (!payload.priceId && !payload.plan && !payload.productId) {
        console.error('UpgradeButton: no priceId, plan or productId available', payload);
        alert('Configuration error: pricing not available. Please contact support.');
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
      try { json = JSON.parse(text); } catch (err) { /* ignore */ }

      if (!res.ok) {
        console.error('create-checkout-session failed', res.status, text);
        alert(`Could not start checkout: ${json?.error || json?.message || res.statusText}`);
        setLoading(false);
        return;
      }

      if (json && json.url) window.location.href = json.url;
      else { console.error('Unexpected response', text); alert('Could not start checkout. Try again.'); setLoading(false); }
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
      data-plan={dataPlan || ''}
      data-product={dataProduct || ''}
    >
      {loading ? 'Starting…' : label}
    </button>
  );
}
