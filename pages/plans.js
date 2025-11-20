import { useState } from 'react';

export default function PlansPage() {
  const [loadingPlan, setLoadingPlan] = useState('');

  async function startCheckout(planKey) {
    try {
      setLoadingPlan(planKey);
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey })
      });
      const body = await res.json();
      if (!res.ok) {
        alert('Could not start checkout: ' + (body?.error || 'unknown'));
        setLoadingPlan('');
        return;
      }
      // Stripe returns a hosted session URL — redirect the browser there
      if (body.url) {
        window.location.href = body.url;
      } else {
        alert('Checkout session created but no redirect URL returned.');
        setLoadingPlan('');
      }
    } catch (err) {
      console.error('checkout error', err);
      alert('Could not start checkout. Try again.');
      setLoadingPlan('');
    }
  }

  return (
    <main style={{ maxWidth: 980, margin: '48px auto', padding: '0 16px' }}>
      <h1>Plans & Pricing</h1>
      <p style={{ color: '#374151', marginTop: 8 }}>
        Pick a plan that matches your team size and pace. Start free to try core Hunt + Reveal features,
        then upgrade for higher limits and team features.
      </p>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16, marginTop: 24 }}>
        <div style={{ border: '1px solid #e6e6e6', padding: 16, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Free</h3>
          <p style={{ margin: 0 }}>Great to try NovaHunt — 5 searches / 2 reveals per month</p>
          <div style={{ marginTop: 12 }}>
            <a href="/signup" style={{ padding: '8px 12px', background: '#e5e7eb', color: '#111', borderRadius: 6, textDecoration: 'none' }}>Create free account</a>
          </div>
        </div>

        <div style={{ border: '1px solid #e6e6e6', padding: 16, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Starter</h3>
          <div style={{ fontSize: 24, fontWeight: 800 }}>$9.99/mo</div>
          <p style={{ marginTop: 8 }}>300 searches / 150 reveals per month — for solo builders and freelancers</p>
          <ul style={{ marginTop: 8, color: '#374151' }}>
            <li style={{ marginBottom: 6 }}>Saved lists & basic CSV export</li>
            <li style={{ marginBottom: 6 }}>Email confidence scores</li>
          </ul>
          <div style={{ marginTop: 12 }}>
            <button onClick={() => startCheckout('starter')} disabled={loadingPlan !== ''} style={{ padding: '8px 12px', background: '#007bff', color: '#fff', borderRadius: 6, border: 'none' }}>
              {loadingPlan === 'starter' ? 'Starting…' : 'Choose Starter'}
            </button>
          </div>
        </div>

        <div style={{ border: '2px solid #f97316', padding: 16, borderRadius: 8, background: '#fffaf0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ marginTop: 0 }}>Pro</h3>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f97316' }}>Most popular</div>
          </div>

          <div style={{ fontSize: 24, fontWeight: 800 }}>$49.99/mo</div>
          <p style={{ marginTop: 8 }}>1,000 searches / 500 reveals per month — for power users and small teams</p>

          <ul style={{ marginTop: 8, color: '#374151' }}>
            <li style={{ marginBottom: 6 }}>Priority support</li>
            <li style={{ marginBottom: 6 }}>Saved teams & shared lists</li>
            <li style={{ marginBottom: 6 }}>CSV export & integrations</li>
          </ul>

          <div style={{ marginTop: 12 }}>
            <button onClick={() => startCheckout('pro')} disabled={loadingPlan !== ''} style={{ padding: '8px 12px', background: '#f97316', color: '#fff', borderRadius: 6, border: 'none' }}>
              {loadingPlan === 'pro' ? 'Starting…' : 'Choose Pro'}
            </button>
          </div>
        </div>

        <div style={{ border: '1px solid #e6e6e6', padding: 16, borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h3 style={{ marginTop: 0 }}>Team</h3>
            <div style={{ fontSize: 20, fontWeight: 800 }}>$199/mo</div>
          </div>

          <p style={{ marginTop: 8 }}>
            Built for collaborative teams and agencies. Shared quotas, per-seat billing, admin controls.
          </p>

          <div style={{ marginTop: 8 }}>
            <strong>What you get</strong>
            <ul style={{ marginTop: 8, color: '#374151' }}>
              <li style={{ marginBottom: 6 }}>Shared team quota: 3,000 searches / 1,500 reveals per month</li>
              <li style={{ marginBottom: 6 }}>Per-seat billing</li>
              <li style={{ marginBottom: 6 }}>Admin dashboard: invite/remove users, set role-based permissions</li>
              <li style={{ marginBottom: 6 }}>SSO support (SAML / OIDC)</li>
              <li style={{ marginBottom: 6 }}>Priority email support and onboarding session</li>
            </ul>
          </div>

          <div style={{ marginTop: 12 }}>
            <button onClick={() => startCheckout('team')} disabled={loadingPlan !== ''} style={{ padding: '8px 12px', background: '#111827', color: '#fff', borderRadius: 6, border: 'none' }}>
              {loadingPlan === 'team' ? 'Starting…' : 'Start Team Trial'}
            </button>
          </div>

          <div style={{ marginTop: 12, color: '#6b7280', fontSize: 13 }}>
            Need custom quotas or enterprise SLAs? Choose Team and we’ll handle billing and provisioning automatically.
          </div>
        </div>
      </section>

      <section style={{ marginTop: 24, color: '#6b7280' }}>
        <h3>Why Teams?</h3>
        <p>
          Teams scale customer discovery: share lists, collaborate on outreach, and manage usage centrally.
          Billing, invoicing, and onboarding are automated so your ops team can stay focused on results.
        </p>

        <h4 style={{ marginTop: 12 }}>Launch faster</h4>
        <p>
          Every Team plan includes a kickoff onboarding call and an account manager to help you migrate lists,
          set up SSO, and configure usage alerts.
        </p>
      </section>
    </main>
  );
}
