import Head from 'next/head';
import UpgradeButton from '../components/UpgradeButton';

export default function Upgrade() {
  return (
    <>
      <Head><title>Upgrade — NovaHunt</title></Head>
      <main style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
        <h1>Upgrade</h1>
        <p>Choose a plan to reveal more contacts and remove limits.</p>
        <div style={{ marginTop: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <strong>Starter</strong> — $49 / month (500 searches)
            <div style={{ marginTop: 8 }}>
              <UpgradeButton label="Choose Starter" priceId={process.env.STRIPE_PRICE_MONTHLY || ''} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
