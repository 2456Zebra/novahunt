import { useState } from 'react';

export default function PlansPage() {
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState(null);

  // Replace these price IDs if you change them in Stripe
  // Use 'free' for the Free plan (no Stripe checkout)
  const PRICES = {
    free: 'free',
    starter: 'price_1SZHGGGyuj9BgGEUftoqaGC8',
    pro: 'price_1SZHJGGyuj9BgGEUQ4uccDvB',
    enterprise: 'price_1SZHKzGyuj9BgGEUh5aCmugi',
  };

  async function startCheckout(priceId) {
    setError(null);
    setLoadingId(priceId);
    try {
      if (priceId === 'free') {
        // Free plan flow: navigate to signup page for immediate account creation.
        // You can implement a /signup or /free-signup page that captures email & password
        // and creates the account in Supabase. Using query param to indicate plan.
        window.location.href = '/signup?plan=free';
        return;
      }

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

      // Use a normal browser redirect to the Stripe Checkout session URL:
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
      <p>Select a plan to begin. Stripe will collect your email during Checkout.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
        <PlanCard
          title="Free"
          price="Free"
          description="5 searches / 3 reveals — great to try the product"
          onSelect={() => startCheckout(PRICES.free)}
          loading={loadingId === PRICES.free}
        />

        <PlanCard
          title="Starter"
          price="$9.99 / mo"
          description="100 searches / 50 reveals — Basic access"
          onSelect={() => startCheckout(PRICES.starter)}
          loading={loadingId === PRICES.starter}
        />

        <PlanCard
          title="Pro"
          price="$49.99 / mo"
          description="1000 searches / 500 reveals — Pro features"
          onSelect={() => startCheckout(PRICES.pro)}
          loading={loadingId === PRICES.pro}
        />

        <PlanCard
          title="Enterprise"
          price="$199.00 / mo"
          description="3000 searches / 1500 reveals — Full access for teams"
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
