'use client';

import React, { useState } from 'react';

/**
 * Simple Checkout button component.
 * Props:
 *  - priceId (string) — the Stripe Price ID to purchase (monthly)
 *  - label (string) — button label
 */
export default function CheckoutButton({ priceId, label = 'Upgrade' }) {
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    setLoading(true);
    try {
      // send local session to server so it can attach customer_email / metadata
      const sessionValue = localStorage.getItem('nh_session') || '';
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nh-session': sessionValue,
        },
        body: JSON.stringify({ priceId }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Checkout creation failed: ${res.status} ${txt}`);
      }

      const payload = await res.json();
      if (payload && payload.url) {
        window.location.href = payload.url;
        return;
      } else {
        throw new Error('Missing checkout url in response');
      }
    } catch (err) {
      console.error(err);
      alert('Could not start checkout: ' + (err?.message || 'unknown'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={startCheckout} disabled={loading} style={{ background: '#111827', color: 'white', padding: '6px 10px', borderRadius: 8, border: 'none' }}>
      {loading ? 'Redirecting…' : label}
    </button>
  );
}
