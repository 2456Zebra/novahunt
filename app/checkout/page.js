'use client';

import { useState } from 'react';

export default function CheckoutPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const plans = [
    { name: 'Starter', priceId: 'price_1SZHGGGyuj9BgGEUftoqaGC8', price: '$9' },
    { name: 'Pro', priceId: 'price_1SZHJGGyuj9BgGEUQ4uccDvB', price: '$19', popular: true },
    { name: 'Enterprise', priceId: 'price_1SZHKzGyuj9BgGEUh5aCmugi', price: '$49' },
  ];

  const startCheckout = async (priceId) => {
    if (!email || !email.includes('@')) return alert('Enter a valid email');
    setLoading(true);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), priceId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || 'Checkout failed');
    } catch (e) {
      alert('Network error');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 48 }}>Choose Your Plan</h1>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="you@company.com"
        style={{ width: 380, padding: 16, fontSize: 18, borderRadius: 8, border: '2px solid #ccc', margin: '30px auto', display: 'block' }}
      />
      <div style={{ display: 'flex', justifyContent: 'center', gap: 50, flexWrap: 'wrap' }}>
        {plans.map(p => (
          <div key={p.priceId} style={{
            padding: 40,
            borderRadius: 16,
            width: 300,
            background: p.popular ? '#0066ff' : '#fff',
            color: p.popular ? 'white' : 'black',
            boxShadow: p.popular ? '0 15px 40px rgba(0,102,255,0.4)' : '0 10px 30px rgba(0,0,0,0.1)',
            transform: p.popular ? 'scale(1.08)' : 'scale(1)',
          }}>
            <h2 style={{ fontSize: 32 }}>{p.name}</h2>
            <p style={{ fontSize: 40, fontWeight: 'bold' }}>{p.price}<span style={{ fontSize: 20 }}>/mo</span></p>
            <button
              onClick={() => startCheckout(p.priceId)}
              disabled={loading}
              style={{
                width: '100%',
                padding: 16,
                marginTop: 20,
                background: p.popular ? 'white' : '#0066ff',
                color: p.popular ? '#0066ff' : 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 18,
                fontWeight: 'bold',
              }}
            >
              {loading ? 'Loading...' : `Choose ${p.name}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
