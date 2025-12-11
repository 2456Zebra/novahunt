import { useState } from 'react';

export default function Pricing() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const startCheckout = async (priceId) => {
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
        window.location.href = data.url; // This is the ONLY correct way now
      } else {
        alert(data.error || 'Checkout failed');
      }
    } catch (err) {
      alert('Network error – please try again');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 1000, margin: '80px auto', textAlign: 'center', fontFamily: 'system-ui' }}>
      <h1>Choose Your Plan</h1>
      <p style={{ marginBottom: 30 }}>Enter your email to get started</p>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        style={{ width: 360, padding: 16, fontSize: 16, borderRadius: 8, border: '1px solid #ccc', marginBottom: 40 }}
      />

      <div style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
        <div style={{ border: '2px solid #ddd', padding: 30, borderRadius: 12, width: 260 }}>
          <h2>Starter</h2>
          <div style={{ fontSize: 36, fontWeight: 'bold', margin: '10px 0' }}>$9<span style={{ fontSize: 18 }}>/mo</span></div>
          <button
            onClick={() => startCheckout('price_1SZHGGGyuj9BgGEUftoqaGC8')}
            disabled={loading}
            style={{ width: '100%', padding: 16, background: '#0066ff', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, marginTop: 20 }}
          >
            {loading ? 'Starting...' : 'Choose Starter'}
          </button>
        </div>

        <div style={{ border: '3px solid #0066ff', padding: 30, borderRadius: 12, width: 260, boxShadow: '0 8px 30px rgba(0,102,255,0.2)' }}>
          <h2>Pro</h2>
          <div style={{ fontSize: 36, fontWeight: 'bold', margin: '10px 0' }}>$19<span style={{ fontSize: 18 }}>/mo</span></div>
          <button
            onClick={() => startCheckout('price_1SZHJGGyuj9BgGEUQ4uccDvB')}
            disabled={loading}
            style={{ width: '100%', padding: 16, background: '#0066ff', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, marginTop: 20 }}
          >
            {loading ? 'Starting...' : 'Choose Pro'}
          </button>
        </div>

        <div style={{ border: '2px solid #ddd', padding: 30, borderRadius: 12, width: 260 }}>
          <h2>Enterprise</h2>
          <div style={{ fontSize: 36, fontWeight: 'bold', margin: '10px 0' }}>$49<span style={{ fontSize: 18 }}>/mo</span></div>
          <button
            onClick={() => startCheckout('price_1SZHKzGyuj9BgGEUh5aCmugi')}
            disabled={loading}
            style={{ width: '100%', padding: 16, background: '#0066ff', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, marginTop: 20 }}
          >
            {loading ? 'Starting...' : 'Choose Enterprise'}
          </button>
        </div>
      </div>
    </div>
  );
}
