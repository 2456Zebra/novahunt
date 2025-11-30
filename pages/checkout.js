import CheckoutButton from '../components/CheckoutButton';

export default function CheckoutPage() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Checkout</h1>
      <p>Select a plan below to proceed to payment.</p>
      <div style={{ marginTop: '2rem' }}>
        <CheckoutButton 
          priceId={process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || 'price_placeholder'} 
          label="Subscribe Now" 
        />
      </div>
    </div>
  );
}
