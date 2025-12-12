'use client';

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
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), priceId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url; // This is the ONLY way now — 100% working
      } else {
        alert(data.error || 'Checkout failed');
      }
    } catch (err) {
      alert('Network error — please try again');
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: '60px 20px', fontFamily: 'system-ui, sans-serif', maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: 42, marginBottom: 20 }}>Choose Your Plan</h1>
      <p style={{ fontSize: 18, marginBottom: 40, color: '#555' }}>Enter your email to get started</p>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        style={{ width: 380, padding: 16, fontSize: 18, borderRadius: 8, border: '2px solid #ccc', marginBottom: 50 }}
      />

      <div style={{ display: 'flex', justifyContent: 'center', gap: 50, flexWrap: 'wrap' }}>
        {/* Starter */}
        <div style={{ background: '#fff', padding: 35, borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.1)', width: 300 }}>
          <h2 style={{ fontSize: 28, margin: '0 0 10px' }}>Starter</h2>
          <div style={{ fontSize: 40, fontWeight: 'bold', margin: '10px 0' }}>$9<span style={{ fontSize: 20 }}>/mo</span></div>
          <button
            onClick={() => handleCheckout('price_1SZHGGGyuj9BgGEUftoqaGC8')}
            disabled={loading || !email.includes('@')}
            style={{ width: '100%', padding: 16, marginTop: 20, background: '#0066ff', color: 'white', border: 'none', borderRadius: 8, fontSize: 18, cursor: 'pointer' }}
          >
            {loading ? 'Loading...' : 'Choose Starter'}
          </button>
        </div>

        {/* Pro — highlighted */}
        <div style={{ background: '#0066ff', color: 'white', padding: 40, borderRadius: 16, boxShadow: '0 15px 40px rgba(0,102,255,0.4)', width: 320, transform: 'scale(1.08)' }}>
          <h2 style={{ fontSize: 32, margin: '0 0 10px' }}>Pro</h2>
          <div style={{ fontSize: 44, fontWeight: 'bold', margin: '10px 0' }}>$19<span style={{ fontSize: 22 }}>/mo</span></div>
          <button
            onClick={() => handleCheckout('price_1SZHJGGyuj9BgGEUQ4uccDvB')}
            disabled={loading || !email.includes('@')}
            style={{ width: '100%', padding: 16, marginTop: 20, background: 'white', color: '#0066ff', border: 'none', borderRadius: 8, fontSize: 18, cursor: 'pointer', fontWeight: 'bold' }}
          >
            {loading ? 'Loading...' : 'Choose Pro'}
          </button>
        </div>

        {/* Enterprise */}
        <div style={{ background: '#fff', padding: 35, borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.1)', width: 300 }}>
          <h2 style={{ fontSize: 28, margin: '0 0 10px' }}>Enterprise</h2>
          <div style={{ fontSize: 40, fontWeight: 'bold', margin: '10px 0' }}>$49<span style={{ fontSize: 20 }}>/mo</span></div>
          <button
            onClick={() => handleCheckout('price_1SZHKzGyuj9BgGEUh5aCmugi')}
            disabled={loading || !email.includes('@')}
            style={{ width: '100%', padding: 16, marginTop: 20, background: '#0066ff', color: 'white', border: 'none', borderRadius: 8, fontSize: 18, cursor: 'pointer' }}
          >
            {loading ? 'Loading...' : 'Choose Enterprise'}
          </button>
        </div>
      </div>
    </div>
  );
}
