import { useState } from 'react';

export default function Upgrade() {
  const [loading, setLoading] = useState(false);

  const redirectToCheckout = async (plan) => {
    setLoading(true);
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      if (!res.ok) throw new Error('Failed');

      const { url } = await res.json();
      window.location = url;
    } catch (err) {
      alert('Checkout failed. Check console.');
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <h1 style={{ fontSize: '36px', fontWeight: 'bold' }}>Upgrade to PRO</h1>
      <p style={{ color: '#666', margin: '20px 0' }}>
        Unlock all emails + unlimited searches.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '24px', width: '280px' }}>
          <h3>Monthly</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold' }}>$10<span style={{ fontSize: '16px' }}>/mo</span></p>
          <button
            onClick={() => redirectToCheckout('monthly')}
            disabled={loading}
            style={{ width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', marginTop: '16px' }}
          >
            {loading ? 'Loading...' : 'Buy Monthly'}
          </button>
        </div>

        <div style={{ border: '2px solid #2563eb', borderRadius: '12px', padding: '24px', width: '280px' }}>
          <h3>Annual <span style={{ background: '#dc2626', color: 'white', fontSize: '12px', padding: '2px 6px', borderRadius: '4px' }}>SAVE 20%</span></h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold' }}>$100<span style={{ fontSize: '16px' }}>/yr</span></p>
          <button
            onClick={() => redirectToCheckout('annual')}
            disabled={loading}
            style={{ width: '100%', padding: '12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', marginTop: '16px' }}
          >
            {loading ? 'Loading...' : 'Buy Annual'}
          </button>
        </div>
      </div>

      <p style={{ marginTop: '40px' }}>
        <a href="/" style={{ color: '#2563eb' }}>← Back</a>
      </p>
    </div>
  );
}
