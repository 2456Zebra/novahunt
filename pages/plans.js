export default function PlansPage() {
  return (
    <main style={{ maxWidth: 980, margin: '48px auto', padding: '0 16px' }}>
      <h1>Plans & Pricing</h1>
      <p style={{ color: '#374151', marginTop: 8 }}>
        Choose a plan that fits your needs. Free tier is great for experimenting. Upgrade anytime for more searches and reveals.
      </p>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginTop: 24 }}>
        <div style={{ border: '1px solid #e6e6e6', padding: 16, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Free</h3>
          <p style={{ margin: 0 }}>Free tier — 5 searches / 2 reveals</p>
          <div style={{ marginTop: 12 }}>
            <a href="/signup" style={{ padding: '8px 12px', background: '#e5e7eb', color: '#111', borderRadius: 6, textDecoration: 'none' }}>Create free account</a>
          </div>
        </div>

        <div style={{ border: '1px solid #e6e6e6', padding: 16, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Starter</h3>
          <div style={{ fontSize: 24, fontWeight: 800 }}>$9.99/mo</div>
          <p style={{ marginTop: 8 }}>Starter — 25 searches / 10 reveals</p>
          <div style={{ marginTop: 12 }}>
            <a href="/checkout?plan=starter" style={{ padding: '8px 12px', background: '#007bff', color: '#fff', borderRadius: 6, textDecoration: 'none' }}>Choose Starter</a>
          </div>
        </div>

        <div style={{ border: '1px solid #e6e6e6', padding: 16, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Pro</h3>
          <div style={{ fontSize: 24, fontWeight: 800 }}>$49.99/mo</div>
          <p style={{ marginTop: 8 }}>Pro — 200 searches / 100 reveals</p>
          <div style={{ marginTop: 12 }}>
            <a href="/checkout?plan=pro" style={{ padding: '8px 12px', background: '#f97316', color: '#fff', borderRadius: 6, textDecoration: 'none' }}>Choose Pro</a>
          </div>
        </div>

        <div style={{ border: '1px solid #e6e6e6', padding: 16, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Team</h3>
          <div style={{ fontSize: 24, fontWeight: 800 }}>$199/mo</div>
          <p style={{ marginTop: 8 }}>Team — priority support and shared quotas (custom limits).</p>
          <div style={{ marginTop: 12 }}>
            <a href="/contact-sales" style={{ padding: '8px 12px', background: '#111827', color: '#fff', borderRadius: 6, textDecoration: 'none' }}>Contact Sales</a>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 24, color: '#6b7280' }}>
        <h3>Need more?</h3>
        <p>
          If you need higher limits or custom enterprise plans, contact us and we’ll help you set up volume pricing.
        </p>
      </section>
    </main>
  );
}
