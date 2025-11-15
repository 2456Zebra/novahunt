'use client';

import React, { useState } from 'react';

/**
 * CheckoutButton: accepts priceId and label.
 * - Posts to /api/create-checkout (proxy) with x-nh-session header from localStorage.
 * - Shows detailed server error messages to the user.
 */
export default function CheckoutButton({ priceId, label = 'Upgrade' }) {
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    if (!priceId) {
      alert('Price ID is missing. Please contact the site admin.');
      return;
    }

    setLoading(true);
    try {
      const sessionValue = localStorage.getItem('nh_session') || '';
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nh-session': sessionValue,
        },
        body: JSON.stringify({
          priceId,
        }),
      });

      let payload = null;
      try {
        payload = await res.json();
      } catch (e) {
        // non-JSON response
      }

      if (!res.ok) {
        const msg = (payload && (payload.error || payload.message)) || `Server returned ${res.status}`;
        throw new Error(msg);
      }

      if (payload && payload.url) {
        window.location.href = payload.url;
        return;
      }

      throw new Error('Missing checkout URL in server response');
    } catch (err) {
      console.error('Checkout error', err);
      alert('Unable to start checkout: ' + (err?.message || 'unknown error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={startCheckout}
      disabled={loading}
      style={{
        background: '#111827',
        color: 'white',
        padding: '8px 12px',
        borderRadius: 8,
        border: 'none',
        cursor: loading ? 'default' : 'pointer',
      }}
    >
      {loading ? 'Redirecting…' : label}
    </button>
  );
}
