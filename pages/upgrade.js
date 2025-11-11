// pages/upgrade.js
import { useEffect, useState } from 'react';

export default function Upgrade() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.onload = () => setLoading(false);
    document.body.appendChild(script);
  }, []);

  const handleCheckout = async () => {
    if (loading) return;

    const stripe = window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const { id } = await res.json();

    stripe.redirectToCheckout({ sessionId: id });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', padding: '60px 20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '16px' }}>Go PRO</h1>
      <p style={{ fontSize: '20px', color: '#444', marginBottom: '40px' }}>
        Unlock <strong>all 411 emails</strong> per domain. No limits.
      </p>

      <div style={{ maxWidth: '400px', margin: '0 auto', padding: '24px', border: '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: '#f9fafb' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>$10/month</h2>
        <p style={{ color: '#666', marginBottom: '24px' }}>Cancel anytime</p>

        <button
          onClick={handleCheckout}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Loading...' : 'Upgrade to PRO'}
        </button>
      </div>

      <p style={{ marginTop: '40px', fontSize: '14px', color: '#999' }}>
        Secure payment via Stripe. No card details stored.
      </p>
    </div>
  );
}
