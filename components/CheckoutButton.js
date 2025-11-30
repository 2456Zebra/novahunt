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
      // Send priceId in three ways to make server-side resolution robust:
      // 1) JSON body, 2) query param, 3) X-Price-Id header
      const url = `/api/create-checkout-session?priceId=${encodeURIComponent(priceId)}`;
      const payload = { priceId };
      console.log('Checkout payload:', payload, 'URL:', url);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Price-Id': priceId,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => {
        throw new Error('Invalid JSON response from server');
      });

      if (!res.ok) {
        // Surface server-provided message if available
        const serverMessage = data && (data.error || JSON.stringify(data));
        console.error('Server error creating checkout session:', serverMessage);
        alert(`Could not start checkout: ${serverMessage}`);
        setLoading(false);
        return;
      }

      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load.');

      const { error } = await stripe.redirectToCheckout({ sessionId: data.id });
      if (error) {
        console.error('Stripe redirect error:', error);
        alert(`Stripe redirect error: ${error.message || error.toString()}`);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert(`Could not start checkout: ${err.message || err.toString()}`);
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
