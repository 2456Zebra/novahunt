import React from 'react';

export default function CancelPage() {
  return (
    <main style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      <h1>Checkout cancelled</h1>
      <p>Your checkout was cancelled. You can return to the <a href="/plans">plans</a> page and try again.</p>
      <p style={{ marginTop: '1rem' }}>
        <a href="/dashboard" style={{ color: '#0b74ff', textDecoration: 'none', fontWeight: 700 }}>
          Back to dashboard
        </a>
      </p>
    </main>
  );
}
