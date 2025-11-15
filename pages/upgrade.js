import React from 'react';
import CheckoutButton from '../components/CheckoutButton';

export default function Upgrade({ starter, pro, team }) {
  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: 24 }}>
      <h1>Upgrade</h1>
      <p>Choose a plan to reveal more contacts and remove limits.</p>

      <div style={{ marginTop: 12, padding: 12, background: '#f3f4f6', borderRadius: 8 }}>
        <strong>Client environment debug (server-side)</strong>
        <div style={{ marginTop: 8 }}>
          <div>NEXT_PUBLIC_PRICE_ID_STARTER_MONTHLY: <code>{starter || '(missing)'}</code></div>
          <div>NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY: <code>{pro || '(missing)'}</code></div>
          <div>NEXT_PUBLIC_PRICE_ID_TEAM_MONTHLY: <code>{team || '(missing)'}</code></div>
        </div>
        <p style={{ marginTop: 8, color: '#6b7280' }}>If any are "(missing)", add them in Vercel (or set the server PRICE_ID_* vars) and redeploy.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 24 }}>
        <div style={{ border: '1px solid #e5e7eb', padding: 16, borderRadius: 8 }}>
          <h3>Starter</h3>
          <div style={{ fontSize: 20, fontWeight: 700 }}>$9.99 <span style={{ fontSize: 12, fontWeight: 400 }}>/ month</span></div>
          <p>500 searches</p>
          {starter ? <CheckoutButton priceId={starter} label="Choose Starter — $9.99 / month" /> : <div style={{ color: '#ef4444' }}>Price ID not configured</div>}
        </div>

        <div style={{ border: '1px solid #e5e7eb', padding: 16, borderRadius: 8 }}>
          <h3>Pro</h3>
          <div style={{ fontSize: 20, fontWeight: 700 }}>$49 <span style={{ fontSize: 12, fontWeight: 400 }}>/ month</span></div>
          <p>Higher limits, include inferred addresses, exports</p>
          {pro ? <CheckoutButton priceId={pro} label="Choose Pro — $49 / month" /> : <div style={{ color: '#ef4444' }}>Price ID not configured</div>}
        </div>

        <div style={{ border: '1px solid #e5e7eb', padding: 16, borderRadius: 8 }}>
          <h3>Team</h3>
          <div style={{ fontSize: 20, fontWeight: 700 }}>$199 <span style={{ fontSize: 12, fontWeight: 400 }}>/ month</span></div>
          <p>Team seats, CSV export, priority support</p>
          {team ? <CheckoutButton priceId={team} label="Choose Team — $199 / month" /> : <div style={{ color: '#ef4444' }}>Price ID not configured</div>}
        </div>
      </div>
    </main>
  );
}

// Run on each request so the page always reflects current env vars (no stale client build)
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
