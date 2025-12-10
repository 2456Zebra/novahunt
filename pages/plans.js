import { useState } from 'react';

export default function PlansPage() {
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState(null);

  // Replace these price IDs if you change them in Stripe
  const PRICES = {
    starter: 'price_1SZHGGGyuj9BgGEUftoqaGC8',
    pro: 'price_1SZHJGGyuj9BgGEUQ4uccDvB',
    enterprise: 'price_1SZHKzGyuj9BgGEUh5aCmugi',
  };

  async function startCheckout(priceId) {
    setError(null);
    setLoadingId(priceId);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error('Server error creating checkout session:', json);
        setError(json?.message || json?.error || 'Could not start checkout');
        setLoadingId(null);
        return;
      }

      const url = json?.url;
      if (!url) {
        console.error('No checkout URL returned from server', json);
        setError('No checkout URL returned from server');
        setLoadingId(null);
        return;
      }

      // IMPORTANT: stripe.redirectToCheckout has been removed.
      // Use a normal browser redirect to the Checkout session URL:
      window.location.href = url;
    } catch (e) {
      console.error('Failed to start checkout', e);
      setError(String(e?.message || e));
      setLoadingId(null);
    }
  }

  return (
    <div style={{ maxWidth: 980, margin: '48px auto', padding: 20 }}>
      <h1>Choose a plan</h1>
      <p>Select a plan to begin checkout. Stripe will collect your email during Checkout.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
        <PlanCard
          title="Starter"
          price="$9.99 / mo"
          description="Basic access"
          onSelect={() => startCheckout(PRICES.starter)}
          loading={loadingId === PRICES.starter}
        />

        <PlanCard
          title="Pro"
          price="$49.99 / mo"
          description="Pro features"
          onSelect={() => startCheckout(PRICES.pro)}
          loading={loadingId === PRICES.pro}
        />

        <PlanCard
          title="Enterprise"
          price="$199.00 / mo"
          description="Full access for teams"
          onSelect={() => startCheckout(PRICES.enterprise)}
          loading={loadingId === PRICES.enterprise}
        />
      </div>

      {error && (
        <div style={{ marginTop: 20, color: 'crimson' }}>
          Could not start checkout: {error}
        </div>
      )}
    </div>
  );
}

function PlanCard({ title, price, description, onSelect, loading }) {
  return (
    <div style={{
      border: '1px solid #e6e6e6',
      borderRadius: 8,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <div>
        <h3 style={{ margin: '0 0 8px 0' }}>{title}</h3>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{price}</div>
        <p style={{ color: '#666' }}>{description}</p>
      </div>

      <div>
        <button
          onClick={onSelect}
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: loading ? '#ddd' : '#0070f3',
            color: loading ? '#333' : '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: loading ? 'default' : 'pointer'
          }}
        >
          {loading ? 'Redirecting…' : 'Choose plan'}
        </button>
      </div>
    </div>
  );
}
