export default function PlansPage() {
  return (
    <main style={{ maxWidth: 980, margin: '48px auto', padding: '0 16px' }}>
      <h1>Plans & Pricing</h1>
      <p style={{ color: '#374151' }}>Choose a plan that fits your needs. Free tier includes 5 searches and 2 reveals.</p>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
        <div style={{ border: '1px solid #e6e6e6', padding: 16, borderRadius: 8 }}>
          <h3>Free</h3>
          <p>5 searches / 2 reveals</p>
          <div style={{ marginTop: 12 }}><a href="/signup" style={{ padding: '8px 12px', background: '#007bff', color: '#fff', borderRadius: 6, textDecoration: 'none' }}>Create free account</a></div>
        </div>

        <div style={{ border: '1px solid #e6e6e6', padding: 16, borderRadius: 8 }}>
          <h3>Pro</h3>
          <p>50 searches / 25 reveals</p>
          <div style={{ marginTop: 12 }}><a href="/checkout" style={{ padding: '8px 12px', background: '#f97316', color: '#fff', borderRadius: 6, textDecoration: 'none' }}>Upgrade to Pro</a></div>
        </div>
      </section>
    </main>
  );
}
