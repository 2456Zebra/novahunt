// pages/upgrade.js
export default function Upgrade() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '4rem auto', padding: '2rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>NovaHunt PRO</h1>
      <p style={{ fontSize: '1.2rem', color: '#666', margin: '1rem 0' }}>
        Unlimited email searches. Real results. No limits.
      </p>
      <div style={{ fontSize: '3rem', fontWeight: 'bold', margin: '2rem 0' }}>
        $10 <span style={{ fontSize: '1.5rem', color: '#666' }}>/month</span>
      </div>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        For the price of a coffee, hunt emails like a pro.
      </p>
      <form action="/api/create-checkout" method="POST">
        <button
          type="submit"
          style={{
            padding: '1rem 2rem',
            background: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Upgrade to PRO
        </button>
      </form>
      <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#999' }}>
        Cancel anytime. Powered by Stripe.
      </p>
    </div>
  );
}
