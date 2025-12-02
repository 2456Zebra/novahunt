import React from 'react';
import Link from 'next/link';
import ErrorBoundary from '../components/ErrorBoundary';

export default function AccountPage() {
  return (
    <ErrorBoundary>
      <main style={{ padding: 24, maxWidth: 980, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h1 style={{ margin: 0 }}>Account</h1>

          {/* Keep Back to Home out of any pulldown: placed explicitly in the header area */}
          <div style={{ zIndex: 80 }}>
            <Link href="/"><a style={{ padding: '8px 10px', background: '#fff', border: '1px solid #e6edf3', borderRadius: 6, textDecoration: 'none', color: '#0b1220' }}>Back to Home</a></Link>
          </div>
        </div>

        <section style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18 }}>
          <div>
            <h2 style={{ marginTop: 0 }}>Profile</h2>
            <p>Manage your account settings, email, and notifications.</p>

            <h3>Usage</h3>
            <p>See your current searches and reveals in the top-right account bar.</p>

            <h3>Billing</h3>
            <p>Manage payment methods and subscription from the Billing page.</p>
          </div>

          <aside style={{ background: '#fff', border: '1px solid #e6edf3', borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 700 }}>Quick links</div>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: 18 }}>
              <li><Link href="/billing"><a>Billing</a></Link></li>
              <li><Link href="/plans"><a>View plans</a></Link></li>
              <li><Link href="/"><a>Home</a></Link></li>
            </ul>
          </aside>
        </section>
      </main>
    </ErrorBoundary>
  );
}
