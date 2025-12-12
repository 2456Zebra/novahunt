'use client';

import { useState } from 'react';

export default function CheckoutTrigger({ children }) {
  const [loading, setLoading] = useState(false);

  const startCheckout = async () => {
    setLoading(true);
    try {
      const email = prompt('Enter your email to continue') || '';
      if (!email.includes('@')) return alert('Valid email required');

      const res = await fetch('/api/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, priceId: 'price_1SZHJGGyuj9BgGEUQ4uccDvB' }), // Pro plan — change if you want
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || 'Failed');
    } catch {
      alert('Network error');
    }
    setLoading(false);
  };

  return (
    <span onClick={startCheckout} style={{ cursor: 'pointer' }}>
      {loading ? 'Loading...' : children}
    </span>
  );
}
