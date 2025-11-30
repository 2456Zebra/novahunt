import React from 'react';
import CheckoutButton from '../components/CheckoutButton';

export default function CheckoutPage() {
  const priceId = process.env.NEXT_PUBLIC_TEST_PRICE_ID || '';

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Checkout</h1>
      <p>Click the button below to proceed to checkout.</p>
      <CheckoutButton priceId={priceId} label="Proceed to Checkout" />
    </div>
  );
}
