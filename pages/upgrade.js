// pages/upgrade.js
export default function Upgrade() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#fff', color: '#000', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>NovaHunt PRO</h1>
        <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '2rem' }}>
          Unlimited email searches. Real results. No limits.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {/* Monthly */}
          <form action="/api/checkout" method="POST">
            <input type="hidden" name="plan" value="monthly" />
            <button style={{
              padding: '1.5rem',
              border: '2px solid #0070f3',
              borderRadius: '12px',
              background: '#fff',
              width: '200px',
              fontWeight: 'bold'
            }}>
              <div style={{ fontSize: '2rem' }}>$10</div>
              <div style={{ color: '#666' }}>/month</div>
              <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Unlimited</div>
            </button>
          </form>

          {/* Annual */}
          <form action="/api/checkout" method="POST">
            <input type="hidden" name="plan" value="annual" />
            <button style={{
              padding: '1.5rem',
              border: '2px solid #10b981',
              borderRadius: '12px',
              background: '#ecfdf5',
              width: '200px',
              fontWeight: 'bold'
            }}>
              <div style={{ fontSize: '2rem' }}>$100</div>
              <div style={{ color: '#666' }}>/year</div>
              <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Save 16%</div>
            </button>
          </form>
        </div>

        <p style={{ marginTop: '2rem', color: '#999', fontSize: '0.9rem' }}>
          Cancel anytime. Powered by Stripe.
        </p>
      </div>
    </div>
  );
}
