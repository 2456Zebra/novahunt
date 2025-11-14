import Link from 'next/link';
import UpgradeButton from './UpgradeButton';

export default function Header() {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', borderBottom: '1px solid #eee' }}>
      <div>
        <Link href="/"><a style={{ fontWeight: 700, fontSize: 18, color: '#111827' }}>NovaHunt</a></Link>
        <span style={{ marginLeft: 10, color: '#6b7280' }}>powered by AI</span>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link href="/signin"><a style={{ padding: '6px 10px' }}>Sign in</a></Link>
        <Link href="/signup"><a style={{ padding: '6px 10px' }}>Sign up</a></Link>
        <UpgradeButton label="Upgrade" priceId={process.env.STRIPE_PRICE_MONTHLY || ''} />
      </div>
    </header>
  );
}
