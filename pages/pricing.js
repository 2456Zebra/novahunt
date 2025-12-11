'use client'; // ← This forces Next.js 13+ App Router client component (100% safe)

import { useState } from 'react';

export default function PricingPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (priceId) => {
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/create-checkout-session', {
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
      alert('Network error');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '60px 20px', fontFamily: 'system-ui, sans-serif', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', fontSize: 42, marginBottom: 40 }}>Choose Your Plan</h1>

      <div style={{ maxWidth: 400, margin: '0 auto 50px' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          style={{ width: '100%', padding: 16, fontSize: 18, borderRadius: 8, border: '2px solid #ddd' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
        <div style={{ background: '#fff', padding: 30, borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.1)', width: 280 }}>
          <h2 style={{ margin: 0, fontSize: 28 }}>Starter</h2>
          <p style={{ fontSize: 38, fontWeight: 'bold', margin: '10px 0' }}>$9<span style={{ fontSize: 20 }}>/mo</span></p>
          <button
            onClick={() => handleCheckout('price_1SZHGGGyuj9BgGEUftoqaGC8')}
            disabled={loading || !email.includes('@')}
            style={{ width: '100%', padding: 16, background: '#0066ff', color: 'white', border: 'none', borderRadius: 8, fontSize: 18, marginTop: 20, cursor: 'pointer' }}
          >
            {loading ? 'Loading...' : 'Choose Starter'}
          </button>
        </div>

        <div style={{ background: '#0066ff', color: 'white', padding: 30, borderRadius: 16, boxShadow: '0 10px 40px rgba(0,102,255,0.3)', width: 280, transform: 'scale(1.05)' }}>
          <h2 style={{ margin: 0, fontSize: 28 }}>Pro</h2>
          <p style={{ fontSize: 38, fontWeight: 'bold', margin: '10px 0' }}>$19<span style={{ fontSize: 20 }}>/mo</span></p>
          <button
            onClick={() => handleCheckout('price_1SZHJGGyuj9BgGEUQ4uccDvB')}
            disabled={loading || !email.includes('@')}
            style={{ width: '100%', padding: 16, background: 'white', color: '#0066ff', border: 'none', borderRadius: 8, fontSize: 18, marginTop: 20, cursor: 'pointer', fontWeight: 'bold' }}
          >
            {loading ? 'Loading...' : 'Choose Pro'}
          </button>
        </div>

        <div style={{ background: '#fff', padding: 30, borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.1)', width: 280 }}>
          <h2 style={{ margin: 0, fontSize: 28 }}>Enterprise</h2>
          <p style={{ fontSize: 38, fontWeight: 'bold', margin: '10px 0' }}>$49<span style={{ fontSize: 20 }}>/mo</span></p>
          <button
            onClick={() => handleCheckout('price_1SZHKzGyuj9BgGEUh5aCmugi')}
            disabled={loading || !email.includes('@')}
            style={{ width: '100%', padding: 16, background: '#0066ff', color: 'white', border: 'none', borderRadius: 8, fontSize: 18, marginTop: 20, cursor: 'pointer' }}
          >
            {loading ? 'Loading...' : 'Choose Enterprise'}
          </button>
        </div>
      </div>
    </div>
  );
}
