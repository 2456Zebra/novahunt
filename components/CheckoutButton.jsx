import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function CheckoutButton({ priceId, children }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!priceId) {
      console.error('Checkout aborted: priceId is missing');
      alert('Developer: priceId is not configured. See console.');
      return;
    }

    setLoading(true);
    try {
      const payload = { priceId };
      console.log('Checkout payload:', payload);
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('Server error creating checkout session:', data);
        setLoading(false);
        return;
      }

      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load.');

      const { error } = await stripe.redirectToCheckout({ sessionId: data.id });
      if (error) console.error('Stripe redirect error:', error);
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading}>
      {children || (loading ? 'Loading…' : 'Checkout')}
    </button>
  );
}
