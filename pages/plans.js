import { useEffect, useState } from 'react';
import CheckoutButton from '../components/CheckoutButton';

// Simple Plans page that fetches available prices (from /api/stripe/prices)
// and posts priceId when user signs up. This guarantees the API receives priceId.
export default function PlansPage() {
  const [prices, setPrices] = useState([]);
  const [selectedPriceId, setSelectedPriceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/stripe/prices');
        const data = await res.json();
        if (res.ok && data.prices && data.prices.length) {
          setPrices(data.prices);
          setSelectedPriceId(data.prices[0].id);
        } else {
          setPrices([]);
        }
      } catch (err) {
        console.error('Failed to load prices', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSignup = async () => {
    setMessage('');
    if (!selectedPriceId) {
      setMessage('Please select a plan.');
      return;
    }

    try {
      // Explicitly call the create-checkout-session API with JSON { priceId }
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: selectedPriceId, planId: selectedPriceId }) // send both for compatibility
      });
      const data = await res.json().catch(() => ({ error: 'Invalid JSON response' }));

      if (!res.ok) {
        console.error('Checkout start failed', data);
        setMessage(`Could not start checkout: ${data.error || JSON.stringify(data)}`);
        return;
      }

      // If using redirectToCheckout on the client, CheckoutButton covers it.
      // For this simple flow we'll redirect using the session id via stripe.js
      const stripePublic = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!stripePublic) {
        setMessage('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in environment.');
        return;
      }

      // Use CheckoutButton component to handle redirect (or just show success)
      // Here we simply return success (CheckoutButton will run the redirect normally in /checkout flow)
      setMessage('Checkout session created. Redirecting…');
      // Redirect to /checkout page which uses CheckoutButton component, passing selectedPriceId via query:
      const nextUrl = `/checkout?priceId=${encodeURIComponent(selectedPriceId)}`;
      window.location.href = nextUrl;
    } catch (err) {
      console.error('Signup error', err);
      setMessage(`Error: ${err.message || err.toString()}`);
    }
  };

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Choose a plan</h1>

      {loading && <p>Loading plans…</p>}

      {!loading && prices.length === 0 && (
        <div>
          <p>No active prices found. Ensure your Stripe products & prices are created and STRIPE_SECRET_KEY is set on the server.</p>
        </div>
      )}

      {!loading && prices.length > 0 && (
        <form onSubmit={(e) => { e.preventDefault(); handleSignup(); }}>
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
                — {typeof p.unit_amount === 'number' ? `${(p.unit_amount / 100).toFixed(2)} ${p.currency.toUpperCase()}` : '—'}
              </label>
            ))}
          </fieldset>

          <div style={{ marginTop: '1rem' }}>
            <button type="submit">Sign up / Checkout</button>
          </div>
        </form>
      )}

      {message && <p style={{ marginTop: '1rem', color: 'crimson' }}>{message}</p>}
    </main>
  );
}
