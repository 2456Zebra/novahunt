/**
 * Checkout Test Page
 * A minimal page to test the CheckoutButton component.
 */
import CheckoutButton from '../components/CheckoutButton';

export default function CheckoutPage() {
  // Example price ID - replace with a real Stripe price ID for testing
  const testPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || 'price_test_example';

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Checkout Test Page</h1>
      <p>
        This is a minimal test page for the Stripe Checkout integration.
        Click the button below to test the checkout flow.
      </p>
      <div style={{ marginTop: '20px' }}>
        <CheckoutButton priceId={testPriceId} label="Test Checkout" />
      </div>
      <div style={{ marginTop: '40px', fontSize: '14px', color: '#666' }}>
        <h3>Environment Variables Required:</h3>
        <ul>
          <li><code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> - Stripe publishable key (pk_test_...)</li>
          <li><code>STRIPE_SECRET_KEY</code> - Stripe secret key (sk_test_...)</li>
          <li><code>STRIPE_WEBHOOK_SECRET</code> - Stripe webhook signing secret (whsec_...)</li>
          <li><code>NEXT_PUBLIC_BASE_URL</code> - Base URL for success/cancel redirects</li>
        </ul>
      </div>
    </div>
  );
}
