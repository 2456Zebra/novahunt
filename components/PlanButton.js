import React from 'react';

/*
  PlanButton
  - props: priceKey (one of 'starter_monthly', 'pro_monthly', 'team_monthly'), children
  - Fetches price IDs from /api/prices, posts selected priceId to /api/create-checkout-session,
    then redirects the browser to the returned session.url.
*/
export default function PlanButton({ priceKey, children, className }) {
  async function startCheckout() {
    try {
      const r = await fetch('/api/prices');
      const available = await r.json();
      const priceId = available[priceKey];
      if (!priceId) {
        alert('Checkout temporarily unavailable (missing plan configuration).');
        return;
      }

      const createRes = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({ error: createRes.statusText }));
        console.error('create-checkout-session failed', err);
        alert('Could not start checkout: ' + (err && err.error ? err.error : createRes.statusText));
        return;
      }

      const payload = await createRes.json();
      if (payload.url) {
        window.location.href = payload.url;
      } else {
        alert('Checkout URL missing from server response.');
      }
    } catch (err) {
      console.error('startCheckout error', err);
      alert('Could not start checkout: ' + (err && err.message ? err.message : 'unknown'));
    }
  }

  return (
    <button onClick={startCheckout} className={className}>
      {children}
    </button>
  );
}
