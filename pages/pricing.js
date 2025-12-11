import { useState } from 'react';

export default function Pricing() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const startCheckout = async (priceId) => {
    if (!email.includes('@')) return alert('Please enter a valid email');
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
    } catch (err) {
      alert('Network error');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 900, margin: '80px auto', textAlign: 'center' }}>
      <h1>Choose Your Plan</h1>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        style={{ width: 340, padding: 14, margin: '20px auto', display: 'block', fontSize: 16 }}
      />

      <div style={{ display: 'flex', justifyContent: 'center', gap: 30, flexWrap: 'wrap' }}>
        <div style={{ border: '2px solid #e0e0e0', padding: 30, borderRadius: 12, width: 240 }}>
          <h2>Starter</h2>
          <p style={{ fontSize: 28 }}>$9<span style={{ fontSize: 16 }}>/mo</span></p>
          <button
            onClick={() => startCheckout('price_1SZHGGGyuj9BgGEUftoqaGC8')}
            disabled={loading || !email.includes('@')}
            style={{ width: '100%', padding: 14, background: '#0066ff', color: 'white', border: 'none', borderRadius: 8 }}
          >
            {loading ? 'Starting...' : 'Choose Starter'}
          </button>
        </div>

        <div style={{ border: '2px solid #0066ff', padding: 30, borderRadius: 12, width: 240, boxShadow: '0 4px 20px rgba(0,102,255,0.2)' }}>
          <h2>Pro</h2>
          <p style={{ fontSize: 28 }}>$19<span style={{ fontSize: 16 }}>/mo</span></p>
          <button
            onClick={() => startCheckout('price_1SZHJGGyuj9BgGEUQ4uccDvB')}
            disabled={loading || !email.includes('@')}
            style={{ width: '100%', padding: 14, background: '#0066ff', color: 'white', border: 'none', borderRadius: 8 }}
          >
            {loading ? 'Starting...' : 'Choose Pro'}
          </button>
        </div>

        <div style={{ border: '2px solid #e0e0e0', padding: 30, borderRadius: 12, width: 240 }}>
          <h2>Enterprise</h2>
          <p style={{ fontSize: 28 }}>$49<span style={{ fontSize: 16 }}>/mo</span></p>
          <button
            onClick={() => startCheckout('price_1SZHKzGyuj9BgGEUh5aCmugi')}
            disabled={loading || !email.includes('@')}
            style={{ width: '100%', padding: 14, background: '#0066ff', color: 'white', border: 'none', borderRadius: 8 }}
          >
            {loading ? 'Starting...' : 'Choose Enterprise'}
          </button>
        </div>
      </div>
    </div>
  );
}
