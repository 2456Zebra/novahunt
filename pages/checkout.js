import CheckoutButton from '../components/CheckoutButton';

export default function CheckoutPage() {
  const priceId = process.env.NEXT_PUBLIC_TEST_PRICE_ID || 'price_xxx';
  return (
    <main>
      <h1>Checkout</h1>
      <CheckoutButton priceId={priceId}>Buy now</CheckoutButton>
    </main>
  );
}
