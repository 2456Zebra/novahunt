import CheckoutButton from '../components/CheckoutButton';

const PLANS = [
  {
    id: 'team_monthly',
    priceId: 'price_replace_with_team_monthly', // <- REPLACE with your Stripe Price ID
    title: 'NovaHunt Team',
    priceLabel: '$199.00 / month',
    subtitle: '3,000 searches / 1,500 reveals per month',
  },
  {
    id: 'pro_monthly',
    priceId: 'price_replace_with_pro_monthly', // <- REPLACE with your Stripe Price ID
    title: 'NovaHunt Pro',
    priceLabel: '$49.99 / month',
    subtitle: '1,000 searches / 500 reveals per month',
  },
  {
    id: 'starter_monthly',
    priceId: 'price_replace_with_starter_monthly', // <- REPLACE with your Stripe Price ID
    title: 'NovaHunt Starter',
    priceLabel: '$9.99 / month',
    subtitle: '300 searches / 150 reveals per month',
  },
  {
    id: 'pro_alt_monthly',
    priceId: 'price_replace_with_pro_alt_monthly', // <- REPLACE with your Stripe Price ID
    title: 'NovaHunt.ai PRO',
    priceLabel: '$10.00 / month',
    subtitle: 'AI-powered lookup: fast email discovery',
  },
];

export default function PlansPage() {
  return (
    <main style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>Choose a plan</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1rem',
          alignItems: 'stretch',
        }}
      >
        {PLANS.map((plan) => (
          <section
            key={plan.id}
            style={{
              border: '1px solid #e6e6e6',
              borderRadius: 8,
              padding: '1rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div>
              <h2 style={{ margin: '0 0 .5rem 0', fontSize: '1.125rem' }}>{plan.title}</h2>
              <div style={{ color: '#111', fontWeight: 700, marginBottom: '.5rem' }}>{plan.priceLabel}</div>
              <div style={{ color: '#555', marginBottom: '1rem' }}>{plan.subtitle}</div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#444' }}>
                <li>Fast email search</li>
                <li>CSV export</li>
                <li>Priority support</li>
              </ul>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <CheckoutButton priceId={plan.priceId}>
                Sign up — {plan.priceLabel.split(' ')[0]}
              </CheckoutButton>
            </div>
          </section>
        ))}
      </div>

      <p style={{ marginTop: '1rem', color: '#666', fontSize: '.95rem' }}>
        Note: Replace the placeholder price IDs (price_replace_with_...) in this file with the exact Stripe Price IDs
        for each plan (they start with "price_"). Do not commit secret keys — set Stripe keys in Vercel env vars.
      </p>
    </main>
  );
}
