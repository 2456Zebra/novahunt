'use client';

import { useState } from 'react';

export default function Checkout() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const plans = [
    { name: 'Starter', priceId: 'price_1SZHGGGyuj9BgGEUftoqaGC8', price: '$9' },
    { name: 'Pro', priceId: 'price_1SZHJGGyuj9BgGEUQ4uccDvB', price: '$19', popular: true },
    { name: 'Enterprise', priceId: 'price_1SZHKzGyuj9BgGEUh5aCmugi', price: '$49' },
  ];

  const startCheckout = async (priceId) => {
    if (!email || !email.includes('@')) return alert('Please enter a valid email');
    setLoading(true);

    try {
      const res = await fetch('/api/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), priceId }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Checkout failed');
      }
    } catch (err) {
      alert('Network error – try again');
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 48, marginBottom: 20 }}>Choose Your Plan</h1>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        style={{
          width: 380,
          padding: 16,
          fontSize: 18,
          borderRadius: 8,
          border: '2px solid #ccc',
          marginBottom: 50,
          display: 'block',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'center', gap: 50, flexWrap: 'wrap' }}>
        {plans.map((plan) => (
          <div
            key={plan.priceId}
            style={{
              padding: 40,
              borderRadius: 16,
              width: 300,
              background: plan.popular ? '#0066ff' : '#fff',
              color: plan.popular ? 'white' : 'black',
              boxShadow: plan.popular ? '0 15px 40px rgba(0,102,255,0.4)' : '0 10px 30px rgba(0,0,0,0.1)',
              transform: plan.popular ? 'scale(1.08)' : 'scale(1)',
            }}
          >
            <h2 style={{ fontSize: 32 }}>{plan.name}</h2>
            <p style={{ fontSize: 40, fontWeight: 'bold' }}>
              {plan.price}
              <span style={{ fontSize: 20 }}>/mo</span>
            </p>
            <button
              onClick={() => startCheckout(plan.priceId)}
              disabled={loading || !email.includes('@')}
              style={{
                width: '100%',
                padding: 16,
                marginTop: 20,
                background: plan.popular ? 'white' : '#0066ff',
                color: plan.popular ? '#0066ff' : 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 18,
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              {loading ? 'Loading...' : `Choose ${plan.name}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
