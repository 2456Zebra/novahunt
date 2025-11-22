import { useState } from 'react';
import Link from 'next/link';

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
      if (body.url) window.location.href = body.url;
      else { alert('Checkout session created but no redirect URL returned.'); setLoadingPlan(''); }
    } catch (err) {
      console.error('checkout error', err);
      alert('Could not start checkout. Try again.');
      setLoadingPlan('');
    }
  }

  return (
    <main style={{ maxWidth: 980, margin: '48px auto', padding: '0 16px', paddingBottom: 64 }}>
      <h1>Plans & Pricing</h1>
      <p style={{ color: '#374151', marginTop: 8 }}>
        Try NovaHunt free, then upgrade for higher monthly quotas and faster results.
      </p>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16, marginTop: 24 }}>
        <div style={{ border: '1px solid #e6e6e6', padding: 16, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Free</h3>
          <p style={{ margin: 0 }}>5 searches / 2 reveals per month</p>
          <div style={{ marginTop: 12 }}>
            <Link href="/signup" style={{ padding: '8px 12px', background: '#e5e7eb', color: '#111', borderRadius: 6, textDecoration: 'none', display: 'inline-block' }}>Create free account</Link>
          </div>
        </div>

        <div style={{ border: '1px solid #e6e6e6', padding: 16, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Starter</h3>
          <div style={{ fontSize: 24, fontWeight: 800 }}>$9.99/mo</div>
          <p style={{ marginTop: 8 }}>300 searches / 150 reveals per month</p>
          <div style={{ marginTop: 12 }}>
            <button onClick={() => startCheckout('starter')} disabled={loadingPlan !== ''} style={{ padding: '8px 12px', background: '#007bff', color: '#fff', borderRadius: 6, border: 'none' }}>
              {loadingPlan === 'starter' ? 'Starting…' : 'Choose Starter'}
            </button>
          </div>
        </div>

        <div style={{ border: '2px solid #f97316', padding: 16, borderRadius: 8, background: '#fffaf0', position: 'relative' }}>
          <div style={{ position: 'absolute', right: 12, top: 12, background: '#f97316', color: '#fff', padding: '6px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
            Most Popular
          </div>
          <h3 style={{ marginTop: 0 }}>Pro</h3>
          <div style={{ fontSize: 24, fontWeight: 800 }}>$49.99/mo</div>
          <p style={{ marginTop: 8 }}>1,000 searches / 500 reveals per month</p>
          <div style={{ marginTop: 12 }}>
            <button onClick={() => startCheckout('pro')} disabled={loadingPlan !== ''} style={{ padding: '8px 12px', background: '#f97316', color: '#fff', borderRadius: 6, border: 'none' }}>
              {loadingPlan === 'pro' ? 'Starting…' : 'Choose Pro'}
            </button>
          </div>
        </div>

        <div style={{ border: '1px solid #e6e6e6', padding: 16, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Team</h3>
          <div style={{ fontSize: 24, fontWeight: 800 }}>$199/mo</div>
          <p style={{ marginTop: 8 }}>3,000 searches / 1,500 reveals per month</p>
          <div style={{ marginTop: 12 }}>
            <button onClick={() => startCheckout('team')} disabled={loadingPlan !== ''} style={{ padding: '8px 12px', background: '#111827', color: '#fff', borderRadius: 6, border: 'none' }}>
              {loadingPlan === 'team' ? 'Starting…' : 'Start Team Trial'}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}