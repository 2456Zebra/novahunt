import { useState } from 'react';

export default function Pricing() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const startCheckout = async (priceId) => {
    setLoading(true);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, priceId }),
      });
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      alert('Checkout failed');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 800, margin: '100px auto', textAlign: 'center' }}>
      <h1>Choose Your Plan</h1>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        style={{ width: 300, padding: 12, margin: '20px 0', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        <div style={{ border: '1px solid #ccc', padding: 20, borderRadius: 8 }}>
          <h2>Starter</h2>
          <p>$9/month</p>
          <button onClick={() => startCheckout('price_1SZHGGGyuj9BgGEUftoqaGC8')} disabled={loading || !email}>
            {loading ? 'Starting...' : 'Choose Starter'}
          </button>
        </div>

        <div style={{ border: '1px solid #ccc', padding: 20, borderRadius: 8 }}>
          <h2>Pro</h2>
          <p>$19/month</p>
          <button onClick={() => startCheckout('price_1SZHJGGyuj9BgGEUQ4uccDvB')} disabled={loading || !email}>
            {loading ? 'Starting...' : 'Choose Pro'}
          </button>
        </div>

        <div style={{ border: '1px solid #ccc', padding: 20, borderRadius: 8 }}>
          <h2>Enterprise</h2>
          <p>$49/month</p>
          <button onClick={() => startCheckout('price_1SZHKzGyuj9BgGEUh5aCmugi')} disabled={loading || !email}>
            {loading ? 'Starting...' : 'Choose Enterprise'}
          </button>
        </div>
      </div>
    </div>
  );
}
