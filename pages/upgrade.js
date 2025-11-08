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
      const { url } = await res.json();
      window.location = url;
    } catch (err) {
      alert('Checkout failed. Try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: '36px', fontWeight: 'bold' }}>Upgrade to PRO</h1>
      <p style={{ fontSize: '18px', color: '#666', margin: '20px 0' }}>
        Unlock unlimited searches and real-time email verification.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '24px', width: '280px' }}>
          <h3 style={{ fontSize: '24px', margin: '0 0 8px' }}>Monthly</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0' }}>$10<span style={{ fontSize: '16px' }}>/mo</span></p>
          <button
            onClick={() => redirectToCheckout('monthly')}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginTop: '16px'
            }}
          >
            {loading ? 'Loading...' : 'Buy Monthly'}
          </button>
        </div>

        <div style={{ border: '2px solid #2563eb', borderRadius: '12px', padding: '24px', width: '280px' }}>
          <h3 style={{ fontSize: '24px', margin: '0 0 8px' }}>Annual <span style={{ background: '#dc2626', color: 'white', fontSize: '12px', padding: '2px 6px', borderRadius: '4px' }}>SAVE 20%</span></h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0' }}>$100<span style={{ fontSize: '16px' }}>/yr</span></p>
          <button
            onClick={() => redirectToCheckout('annual')}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginTop: '16px'
            }}
          >
            {loading ? 'Loading...' : 'Buy Annual'}
          </button>
        </div>
      </div>

      <p style={{ marginTop: '40px', color: '#666' }}>
        <a href="/" style={{ color: '#2563eb' }}>← Back to search</a>
      </p>
    </div>
  );
}
