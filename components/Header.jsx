'use client';

import React from 'react';
import Link from 'next/link';
import HeaderUserSnippet from './HeaderUserSnippet';
import UsageWidget from './UsageWidget';

/**
 * Site header — copy/paste this entire file into components/Header.jsx (replace your existing header).
 * It renders:
 * - left: logo / home link
 * - center: simple nav
 * - right: clickable signed-in email (HeaderUserSnippet) and small UsageWidget
 *
 * This is intentionally self-contained and uses inline styles to avoid depending on your CSS system.
 * If you use Tailwind or a global header already, paste the contents into your existing header component instead.
 */

export default function Header() {
  return (
    <header style={{
      width: '100%',
      borderBottom: '1px solid #e6e7ea',
      background: '#fff',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px'
      }}>
        {/* Left: logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/">
            <a style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#111827' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect width="24" height="24" rx="6" fill="#0f172a" />
                <text x="12" y="16" textAnchor="middle" fontSize="12" fill="#fff" fontFamily="Arial, Helvetica, sans-serif">NH</text>
              </svg>
              <span style={{ fontWeight: 700 }}>NovaHunt</span>
            </a>
          </Link>
        </div>

        {/* Center: nav */}
        <nav style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/"><a style={{ color: '#374151', textDecoration: 'none' }}>Dashboard</a></Link>
          <Link href="/search"><a style={{ color: '#374151', textDecoration: 'none' }}>Search</a></Link>
          <Link href="/upgrade"><a style={{ color: '#374151', textDecoration: 'none' }}>Upgrade</a></Link>
        </nav>

        {/* Right: account + usage */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* UsageWidget is lightweight and will fetch account usage when mounted */}
          <div style={{ display: 'none', alignItems: 'center' /* set to 'flex' to show widget in header */ }}>
            <UsageWidget />
          </div>

          {/* HeaderUserSnippet shows Sign in or clickable email that opens AccountPopover */}
          <div>
            <HeaderUserSnippet />
          </div>
        </div>
      </div>
    </header>
  );
}
