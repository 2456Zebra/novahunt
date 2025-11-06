// components/Nav.js
import React from 'react';
import Link from 'next/link';

export default function Nav() {
  return (
    <nav style={{
      display: 'flex', gap: '12px', padding: '12px 20px',
      borderBottom: '1px solid #eee', alignItems: 'center', background: '#fff'
    }}>
      <Link href="/"><a>Home</a></Link>
      <Link href="/signup"><a>Sign Up</a></Link>
      <Link href="/signin"><a>Sign In</a></Link>
      <Link href="/upgrade"><a>Upgrade</a></Link>
      <Link href="/what-you-get"><a>What You Get</a></Link>
      <Link href="/forgot-password"><a>Forgot Password</a></Link>
    </nav>
  );
}