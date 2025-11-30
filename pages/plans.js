import { useEffect, useState } from 'react';
import CheckoutButton from '../components/CheckoutButton';

function formatPrice(amount, currency) {
  if (typeof amount !== 'number') return '—';
  const value = amount / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}

export default function PlansPage() {
  const [prices, setPrices] = useState([]);
  const [selectedPriceId, setSelectedPriceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/stripe/prices');
        const data = await res.json();
        if (res.ok && data.prices && data.prices.length) {
          // Deduplicate by price id (should be unique already, but be safe)
          const seen = new Map();
          data.prices.forEach((p) => {
            if (!seen.has(p.id)) seen.set(p.id, p);
          });
          const unique = Array.from(seen.values());
          setPrices(unique);
          setSelectedPriceId(unique[0] ? unique[0].id : null);
        } else {
          setPrices([]);
          setSelectedPriceId(null);
        }
      } catch (err) {
        console.error('Failed to load prices', err);
        setError('Could not load plans at this time.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Choose a plan</h1>

      {loading && <p>Loading plans…</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {!loading && prices.length === 0 && (
        <div>
          <p>No active prices found. Ensure your Stripe products & prices are created and STRIPE_SECRET_KEY is set on the server.</p>
        </div>
      )}

      {!loading && prices.length > 0 && (
        <form onSubmit={(e) => e.preventDefault()}>
          <fieldset>
            <legend>Plans</legend>
            {prices.map((p) => (
              <label key={p.id} style={{ display: 'block', margin: '8px 0' }}>
                <input
                  type="radio"
                  name="plan"
                  value={p.id}
                  checked={selectedPriceId === p.id}
                  onChange={() => setSelectedPriceId(p.id)}
                />{' '}
                <strong>{p.product?.name || p.nickname || p.id}</strong>{' '}
                — {formatPrice(p.unit_amount, p.currency)}{' '}
                {p.recurring ? <em> / {p.recurring.interval}</em> : <span> (one-time)</span>}{' '}
                {p.product?.description ? <span style={{ color: '#666' }}> — {p.product.description}</span> : null}
              </label>
            ))}
          </fieldset>

          <div style={{ marginTop: '1rem' }}>
            <CheckoutButton priceId={selectedPriceId}>Sign up / Checkout</CheckoutButton>
          </div>
        </form>
      )}
    </main>
  );
}
