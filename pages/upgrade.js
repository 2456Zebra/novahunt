import { useState } from 'react';

export default function Upgrade() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (plan) => {
    setLoading(true);
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      window.location.href = data.url;
    } catch (err) {
      alert('Checkout failed');
    }
    setLoading(false);
  };

  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '16px' }}>Upgrade to PRO</h1>
      <p style={{ color: '#666', fontSize: '18px', marginBottom: '40px' }}>Unlimited emails + priority support.</p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', width: '280px', backgroundColor: '#f9fafb' }}>
          <h3 style={{ fontSize: '20px', margin: '0 0 8px 0' }}>Monthly</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0' }}>$10<span style={{ fontSize: '16px', color: '#6b7280' }}>/mo</span></p>
          <button 
            onClick={() => handleCheckout('monthly')} 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '12px', 
              backgroundColor: '#2563eb', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              marginTop: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Loading...' : 'Buy Monthly'}
          </button>
        </div>

        <div style={{ 
          border: '2px solid #2563eb', 
          borderRadius: '12px', 
          padding: '24px', 
          width: '280px', 
          position: 'relative',
          backgroundColor: '#eff6ff'
        }}>
          <div style={{ 
            position: 'absolute', 
            top: '-12px', 
            right: '16px', 
            background: '#dc2626', 
            color: 'white', 
            fontSize: '12px', 
            padding: '4px 8px', 
            borderRadius: '4px',
            fontWeight: 'bold'
          }}>
            SAVE 20%
          </div>
          <h3 style={{ fontSize: '20px', margin: '0 0 8px 0' }}>Annual</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0' }}>$100<span style={{ fontSize: '16px', color: '#6b7280' }}>/yr</span></p>
          <p style={{ fontSize: '14px', color: '#dc2626', margin: '8px 0 0 0' }}>$8.33/mo</p>
          <button 
            onClick={() => handleCheckout('annual')} 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '12px', 
              backgroundColor: '#dc2626', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              marginTop: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Loading...' : 'Buy Annual'}
          </button>
        </div>
      </div>

      <p style={{ marginTop: '48px', fontSize: '14px', color: '#6b7280' }}>
        <a href="/" style={{ color: '#2563eb', textDecoration: 'none' }}>← Back to Search</a>
      </p>
    </div>
  );
}
