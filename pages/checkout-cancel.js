import Link from 'next/link';

export default function Cancel() {
  return (
    <main style={{ padding: 20 }}>
      <h1>Payment canceled</h1>
      <p>Payment was canceled. You can try again or contact support.</p>
      <Link href="/" style={{ color: '#2563eb' }}>Back to dashboard</Link>
    </main>
  );
}
