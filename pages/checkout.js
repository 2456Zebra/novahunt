import { useEffect, useState } from 'react';
import CheckoutButton from '../components/CheckoutButton';

export default function CheckoutPage() {
  // Use the env test price if set, otherwise fall back to a clearly-visible placeholder
  const envPrice = process.env.NEXT_PUBLIC_TEST_PRICE_ID;
  const [priceId, setPriceId] = useState(envPrice || 'price_xxx');

  useEffect(() => {
    console.log('Checkout page priceId (from env or fallback):', priceId);
  }, [priceId]);

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Checkout</h1>
      <p>
        Current priceId: <strong>{priceId}</strong>
      </p>
      <p style={{ color: '#a00' }}>
        If this shows "price_xxx", replace NEXT_PUBLIC_TEST_PRICE_ID in your environment with a real Price ID.
      </p>
      <CheckoutButton priceId={priceId}>Buy now</CheckoutButton>
    </main>
  );
}
