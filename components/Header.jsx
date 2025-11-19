'use client';

import Link from 'next/link';
import HeaderAuth from './HeaderAuth';

export default function Header() {
  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #e6e6e6' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/">
          <a style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <img src="/logo.svg" alt="NovaHunt" style={{ height: 28 }} />
            <strong style={{ color: '#111' }}>NovaHunt</strong>
          </a>
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <HeaderAuth />
      </div>
    </header>
  );
}
