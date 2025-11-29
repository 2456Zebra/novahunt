import React, { useState } from 'react';

/*
  UpgradeButton
  - Expects props: priceId (string), email (optional string), label (optional)
  - Validates priceId and posts to /api/create-checkout-session
  - Shows loading state and friendly error messages
  - Redirects the browser to session.url when successful
*/

export default function UpgradeButton({ priceId, email, label = 'Upgrade' }) {
  const [loading, setLoading] = useState(false);

  const startCheckout = async () => {
    if (!priceId || typeof priceId !== 'string') {
      console.error('UpgradeButton: missing or invalid priceId', priceId);
      alert('Configuration error: price not available. Please contact support.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, email }),
      });

      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch (e) { /* not JSON */ }

      if (!res.ok) {
        const errMsg = (json && (json.error || json.message)) || res.statusText || 'Could not start checkout';
        console.error('create-checkout-session failed', res.status, text);
        alert(`Could not start checkout: ${errMsg}`);
        setLoading(false);
        return;
      }

      if (json && json.url) {
        // redirect to Stripe Checkout
        window.location.href = json.url;
      } else {
        console.error('Unexpected create-checkout-session response', text);
        alert('Could not start checkout: unexpected server response.');
        setLoading(false);
      }
    } catch (err) {
      console.error('UpgradeButton: network/error', err);
      alert('Could not start checkout. Try again.');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={startCheckout}
      disabled={loading}
      data-plan-price-id={priceId || ''}
      className="upgrade-button"
      aria-busy={loading}
    >
      {loading ? 'Starting…' : label}
    </button>
  );
}
