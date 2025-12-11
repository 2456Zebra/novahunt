import React from 'react';
import CheckoutButton from '../components/CheckoutButton';

export default function Upgrade({ starter, pro, team }) {
  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: 24 }}>
      <h1>Upgrade</h1>
      <p>Choose a plan to reveal more contacts and remove limits.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 24 }}>
        <div style={{ border: '1px solid #e5e7eb', padding: 16, borderRadius: 8 }}>
          <h3>Starter</h3>
          <div style={{ fontSize: 20, fontWeight: 700 }}>$9.99 <span style={{ fontSize: 12, fontWeight: 400 }}>/ month</span></div>
          <ul>
            <li>500 domain searches / month</li>
            <li>100 contact reveals / month</li>
            <li>Basic CSV export & email validation</li>
          </ul>
          {starter ? <CheckoutButton priceId={starter} label="Choose Starter — $9.99 / month" /> : <div style={{ color: '#ef4444' }}>Price ID not configured</div>}
        </div>

        <div style={{ border: '1px solid #e5e7eb', padding: 16, borderRadius: 8 }}>
          <h3>Pro</h3>
          <div style={{ fontSize: 20, fontWeight: 700 }}>$49 <span style={{ fontSize: 12, fontWeight: 400 }}>/ month</span></div>
          <ul>
            <li>2,000 domain searches / month</li>
            <li>500 contact reveals / month</li>
            <li>Include inferred addresses, full CSV exports, priority verification</li>
          </ul>
          {pro ? <CheckoutButton priceId={pro} label="Choose Pro — $49 / month" /> : <div style={{ color: '#ef4444' }}>Price ID not configured</div>}
        </div>

        <div style={{ border: '1px solid #e5e7eb', padding: 16, borderRadius: 8 }}>
          <h3>Team</h3>
          <div style={{ fontSize: 20, fontWeight: 700 }}>$199 <span style={{ fontSize: 12, fontWeight: 400 }}>/ month</span></div>
          <ul>
            <li>10,000 domain searches / month</li>
            <li>2,000 contact reveals / month</li>
            <li>Team seats, shared usage dashboard, priority support</li>
          </ul>
          {team ? <CheckoutButton priceId={team} label="Choose Team — $199 / month" /> : <div style={{ color: '#ef4444' }}>Price ID not configured</div>}
        </div>
      </div>

      <div style={{ marginTop: 20, color: '#6b7280' }}>
        <strong>Note:</strong> If you have questions about billing or need custom team pricing, contact support@novahunt.ai.
      </div>
    </main>
  );
}

// Keep server-side env lookup so the page always reflects live env values.
export async function getServerSideProps() {
  const starter = process.env.NEXT_PUBLIC_PRICE_ID_STARTER_MONTHLY || process.env.PRICE_ID_STARTER_MONTHLY || null;
  const pro = process.env.NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY || process.env.PRICE_ID_PRO_MONTHLY || null;
  const team = process.env.NEXT_PUBLIC_PRICE_ID_TEAM_MONTHLY || process.env.PRICE_ID_TEAM_MONTHLY || null;

  return {
    props: {
      starter,
      pro,
      team,
    },
  };
}
