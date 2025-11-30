'use client';

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe.js with the publishable key
// Note: Will be null if NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

/**
 * CheckoutButton: accepts priceId and label.
 * Uses @stripe/stripe-js to load Stripe and redirectToCheckout.
 * Posts to /api/create-checkout-session to create a Checkout Session.
 */
export default function CheckoutButton({ priceId, label = 'Upgrade' }) {
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    if (!priceId) {
      alert('Price ID is missing. Please contact the site admin.');
      return;
    }

    if (!stripePromise) {
      alert('Stripe is not configured. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.');
      return;
    }

    setLoading(true);
    try {
      // Create a Checkout Session on the server
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server returned ${res.status}`);
      }

      // Redirect to Stripe Checkout using the session ID
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe.js failed to load');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: data.id,
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Unable to start checkout: ' + (err?.message || 'unknown error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={startCheckout}
      disabled={loading}
      style={{
        background: '#111827',
        color: 'white',
        padding: '8px 12px',
        borderRadius: 8,
        border: 'none',
        cursor: loading ? 'default' : 'pointer',
      }}
    >
      {loading ? 'Redirecting…' : label}
    </button>
  );
}
