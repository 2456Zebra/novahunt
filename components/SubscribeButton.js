// Simple Subscribe button component — ensures priceId is sent to the API
// Usage: <SubscribeButton priceId="price_1SW1uNGyuj9BgGEUEuHiifyT" email={userEmail} />

import React, { useState } from 'react';

export default function SubscribeButton({ priceId, email }) {
  const [loading, setLoading] = useState(false);
  const startCheckout = async () => {
    if (!priceId || typeof priceId !== 'string') {
      console.error('SubscribeButton: missing priceId', priceId);
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
      let json;
      try { json = JSON.parse(text); } catch (e) { json = null; }
      if (!res.ok) {
        console.error('create-checkout-session failed', res.status, text);
        alert(`Could not start checkout: ${json && json.error ? json.error : res.statusText}`);
        setLoading(false);
        return;
      }
      if (json && json.url) {
        // Optionally save session id to localStorage: localStorage.setItem('stripe_session_id', json.id);
        window.location.href = json.url;
      } else {
        console.error('Unexpected response from create-checkout-session', text);
        alert('Could not start checkout: unexpected response from server.');
      }
    } catch (err) {
      console.error('startCheckout error', err);
      alert('Could not start checkout. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={startCheckout} disabled={loading} className="subscribe-button">
      {loading ? 'Starting...' : 'Subscribe'}
    </button>
  );
}
