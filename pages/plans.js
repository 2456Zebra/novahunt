import CheckoutButton from '../components/CheckoutButton';
import { useEffect } from 'react';

const PLANS = [
  {
    id: 'free',
    priceId: null, // Free plan — no Stripe checkout
    title: 'NovaHunt Free',
    priceLabel: 'Free',
    subtitle: 'Explore NovaHunt with limited monthly searches',
    features: ['5 searches / 3 reveals per month', 'Community support'],
    badge: 'Free',
    recommended: false,
  },
  {
    id: 'starter',
    // Set this in Vercel: NEXT_PUBLIC_PRICE_STARTER
    priceId: process.env.NEXT_PUBLIC_PRICE_STARTER || null,
    title: 'NovaHunt Starter',
    priceLabel: '$9.99 / month',
    subtitle: 'For individuals getting started with prospecting',
    features: ['100 searches / 50 reveals per month', 'Email support'],
    badge: 'Popular',
    recommended: false,
  },
  {
    id: 'pro',
    // Set this in Vercel: NEXT_PUBLIC_PRICE_PRO
    priceId: process.env.NEXT_PUBLIC_PRICE_PRO || null,
    title: 'NovaHunt Pro',
    priceLabel: '$49.99 / month',
    subtitle: 'Advanced search volume and priority support',
    features: ['1,000 searches / 500 reveals per month', 'Priority support', 'CSV export'],
    badge: 'Most popular',
    recommended: true,
  },
  {
    id: 'enterprise',
    // Set this in Vercel: NEXT_PUBLIC_PRICE_ENTERPRISE
    priceId: process.env.NEXT_PUBLIC_PRICE_ENTERPRISE || null,
    title: 'NovaHunt Enterprise',
    priceLabel: '$199.00 / month',
    subtitle: 'Full power for teams and heavy usage',
    features: ['3,000 searches / 1,500 reveals per month', 'Dedicated support', 'CSV export'],
    badge: 'Enterprise',
    recommended: false,
  },
];

const cardStyle = {
  border: '1px solid #e8e8e8',
  borderRadius: 10,
  padding: '1.25rem',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  background: '#fff',
  boxShadow: '0 6px 18px rgba(12,18,26,0.04)',
  minHeight: 220,
};

export default function PlansPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('Plans page loaded');
    }
  }, []);

  return (
    <main style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      <header style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ margin: 0 }}>Choose a plan</h1>
        <p style={{ marginTop: '.5rem', color: '#555' }}>
          Start free or pick a plan that fits your prospecting needs. Upgrade or cancel anytime.
        </p>
      </header>

      <section
        aria-label="Pricing plans"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1rem',
        }}
      >
        {PLANS.map((plan) => (
          <article key={plan.id} style={cardStyle} aria-labelledby={`plan-${plan.id}-title`}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h2 id={`plan-${plan.id}-title`} style={{ margin: '0 0 0.25rem 0', fontSize: '1.125rem' }}>
                  {plan.title}
                </h2>

                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontWeight: 700,
                      color: '#111',
                      marginBottom: 6,
                    }}
                  >
                    {plan.priceLabel}
                  </div>
                  <div
                    style={{
                      fontSize: '.85rem',
                      color: '#666',
                    }}
                  >
                    {plan.subtitle}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '.75rem', display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                {plan.recommended && (
                  <span
                    style={{
                      background: '#0b74ff',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: 999,
                      fontSize: '.8rem',
                      fontWeight: 600,
                    }}
                  >
                    Recommended
                  </span>
                )}

                <span
                  style={{
                    background: '#f3f4f6',
                    color: '#333',
                    padding: '4px 8px',
                    borderRadius: 999,
                    fontSize: '.8rem',
                    fontWeight: 600,
                  }}
                >
                  {plan.badge}
                </span>
              </div>

              <ul style={{ marginTop: '1rem', paddingLeft: '1.2rem', color: '#333' }}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ marginTop: '1rem' }}>
              {plan.priceId ? (
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  <CheckoutButton priceId={plan.priceId}>
                    {`Sign Up — ${plan.priceLabel.split(' ')[0]}`}
                  </CheckoutButton>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  <a
                    href="/signup"
                    style={{
                      display: 'inline-block',
                      padding: '10px 16px',
                      borderRadius: 6,
                      textDecoration: 'none',
                      background: '#0b74ff',
                      color: '#fff',
                      fontWeight: 600,
                    }}
                    aria-label="Get started for free"
                  >
                    Get started — Free
                  </a>
                </div>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
