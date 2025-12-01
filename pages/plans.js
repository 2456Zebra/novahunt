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
    // Vercel env: NEXT_PUBLIC_PRICE_STARTER
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
    // Vercel env: NEXT_PUBLIC_PRICE_PRO
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
    // Vercel env: NEXT_PUBLIC_PRICE_ENTERPRISE
    priceId: process.env.NEXT_PUBLIC_PRICE_ENTERPRISE || null,
    title: 'NovaHunt Enterprise',
    priceLabel: '$199.00 / month',
    subtitle: 'Full power for teams and heavy usage',
    features: ['3,000 searches / 1,500 reveals per month', 'Dedicated support', 'CSV export'],
    badge: 'Enterprise',
    recommended: false,
  },
];

const containerStyle = {
  padding: '2rem',
  maxWidth: 1100,
  margin: '0 auto',
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '1rem',
};

const cardBase = {
  border: '1px solid #e8e8e8',
  borderRadius: 12,
  padding: '1.25rem',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  background: '#fff', // white background for all
  minHeight: 240,
};

export default function PlansPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('Plans page loaded');
    }
  }, []);

  return (
    <main style={containerStyle}>
      <header style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0 }}>Choose a plan</h1>
          <p style={{ marginTop: '.5rem', color: '#555' }}>
            Start free or pick a plan that fits your prospecting needs. Upgrade or cancel anytime.
          </p>
        </div>

        <div>
          <a
            href="/"
            style={{ color: '#0b74ff', textDecoration: 'none', fontWeight: 600 }}
            aria-label="Back to Home"
          >
            Back to Home
          </a>
        </div>
      </header>

      <section aria-label="Pricing plans" style={gridStyle}>
        {PLANS.map((plan) => {
          // For Pro plan, use a subtle peach background
          const proPeach =
            plan.id === 'pro'
              ? { background: 'linear-gradient(180deg, #fff4ef, #fff6f2)', border: '1px solid rgba(255,160,120,0.18)' }
              : {};

          // Recommended card subtle glow
          const recommendedGlow = plan.recommended
            ? { boxShadow: '0 12px 36px rgba(138,43,226,0.06), 0 6px 18px rgba(11,116,255,0.04)' }
            : {};

          const cardStyle = { ...cardBase, ...proPeach, ...recommendedGlow };

          return (
            <article key={plan.id} style={cardStyle} aria-labelledby={`plan-${plan.id}-title`}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h2 id={`plan-${plan.id}-title`} style={{ margin: '0 0 0.25rem 0', fontSize: '1.125rem' }}>
                    {plan.title}
                  </h2>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#111', marginBottom: 6 }}>{plan.priceLabel}</div>
                    <div style={{ fontSize: '.85rem', color: '#666' }}>{plan.subtitle}</div>
                  </div>
                </div>

                <div style={{ marginTop: '.75rem', display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                  {plan.recommended && (
                    <span
                      style={{
                        background: 'linear-gradient(90deg,#8a2be2,#6b8cff)',
                        color: '#fff',
                        padding: '4px 8px',
                        borderRadius: 999,
                        fontSize: '.8rem',
                        fontWeight: 700,
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
                    <div style={{ borderRadius: 10, overflow: 'hidden' }}>
                      <CheckoutButton priceId={plan.priceId}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '10px 18px',
                            minWidth: 160,
                            textAlign: 'center',
                            fontWeight: 800,
                            color: '#fff',
                            background: 'linear-gradient(90deg,#0b74ff,#6b8cff)',
                            borderRadius: 10,
                            boxShadow: '0 8px 22px rgba(11,116,255,0.12)',
                            textDecoration: 'none',
                          }}
                        >
                          {`Sign Up — ${plan.priceLabel.split(' ')[0]}`}
                        </span>
                      </CheckoutButton>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    <a
                      href="/signup"
                      style={{
                        display: 'inline-block',
                        padding: '10px 18px',
                        borderRadius: 10,
                        textDecoration: 'none',
                        background: '#0b74ff',
                        color: '#fff',
                        fontWeight: 700,
                        minWidth: 160,
                        textAlign: 'center',
                      }}
                      aria-label="Get started for free"
                    >
                      Get started — Free
                    </a>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
