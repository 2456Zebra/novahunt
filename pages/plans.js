export default function PlansPage() {
  return (
    <main style={{ maxWidth: 980, margin: '48px auto', padding: '0 16px' }}>
      <h1>Plans & Pricing</h1>
      <p style={{ color: '#374151', marginTop: 8 }}>
        Pick a plan that matches your team size and pace. Start free to try the core email Hunt + Reveal
        features, then upgrade for higher limits, collaboration, and priority support.
      </p>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16, marginTop: 24 }}>
        <div style={{ border: '1px solid #e6e6e6', padding: 16, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Free</h3>
          <p style={{ margin: 0 }}>Great to try NovaHunt — 5 searches / 2 reveals</p>
          <div style={{ marginTop: 12 }}>
            <a href="/signup" style={{ padding: '8px 12px', background: '#e5e7eb', color: '#111', borderRadius: 6, textDecoration: 'none' }}>Create free account</a>
          </div>
        </div>

        <div style={{ border: '1px solid #e6e6e6', padding: 16, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Starter</h3>
          <div style={{ fontSize: 24, fontWeight: 800 }}>$9.99/mo</div>
          <p style={{ marginTop: 8 }}>25 searches / 10 reveals — for solo builders and freelancers</p>
          <ul style={{ marginTop: 8, color: '#374151' }}>
            <li style={{ marginBottom: 6 }}>Saved lists & basic CSV export</li>
            <li style={{ marginBottom: 6 }}>Email confidence scores</li>
          </ul>
          <div style={{ marginTop: 12 }}>
            <a href="/checkout?plan=starter" style={{ padding: '8px 12px', background: '#007bff', color: '#fff', borderRadius: 6, textDecoration: 'none' }}>Choose Starter</a>
          </div>
        </div>

        <div style={{ border: '2px solid #f97316', padding: 16, borderRadius: 8, background: '#fffaf0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ marginTop: 0 }}>Pro</h3>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f97316' }}>Most popular</div>
          </div>

          <div style={{ fontSize: 24, fontWeight: 800 }}>$49.99/mo</div>
          <p style={{ marginTop: 8 }}>200 searches / 100 reveals — for power users and small teams</p>

          <ul style={{ marginTop: 8, color: '#374151' }}>
            <li style={{ marginBottom: 6 }}>Priority support</li>
            <li style={{ marginBottom: 6 }}>Saved teams & shared lists</li>
            <li style={{ marginBottom: 6 }}>CSV export & integrations</li>
          </ul>

          <div style={{ marginTop: 12 }}>
            <a href="/checkout?plan=pro" style={{ padding: '8px 12px', background: '#f97316', color: '#fff', borderRadius: 6, textDecoration: 'none' }}>Choose Pro</a>
          </div>
        </div>

        <div style={{ border: '1px solid #e6e6e6', padding: 16, borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h3 style={{ marginTop: 0 }}>Team</h3>
            <div style={{ fontSize: 20, fontWeight: 800 }}>$199/mo</div>
          </div>

          <p style={{ marginTop: 8 }}>
            Built for collaborative teams and agencies. Includes shared quotas, admin controls, and dedicated onboarding.
          </p>

          <div style={{ marginTop: 8 }}>
            <strong>What you get</strong>
            <ul style={{ marginTop: 8, color: '#374151' }}>
              <li style={{ marginBottom: 6 }}>Shared team quota: customizable searches & reveals pooled across the team</li>
              <li style={{ marginBottom: 6 }}>Per-seat billing: add seats at a predictable monthly rate</li>
              <li style={{ marginBottom: 6 }}>Admin dashboard: invite/remove users, set role-based permissions</li>
              <li
