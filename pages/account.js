import React from 'react';
import Link from 'next/link';
import ErrorBoundary from '../components/ErrorBoundary';

export default function AccountPage() {
  return (
    <ErrorBoundary>
      <main style={{ padding: 24, maxWidth: 980, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h1 style={{ margin: 0 }}>Account</h1>
          {/* Move Back to Home here and ensure it has a higher z-index so pulldowns don't overlap it */}
          <div style={{ zIndex: 80 }}>
            <Link href="/"><a style={{ padding: '8px 10px', background: '#fff', border: '1px solid #e6edf3', borderRadius: 6 }}>Back to Home</a></Link>
          </div>
        </div>

        <section style={{ marginTop: 18 }}>
          {/* account content here */}
          <p>Your account settings...</p>
        </section>
      </main>
    </ErrorBoundary>
  );
}
