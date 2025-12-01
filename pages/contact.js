import React from 'react';

/*
pages/contact.js
- Updated per your instructions:
  1) Removed the "Thank you — we look forward to helping you." line.
  2) Added "We usually reply within 1 business day." near the bottom (moved).
  3) Removed the earlier duplicate "We usually reply..." (so it appears only once).
  4) Replaced the email sentence with: "Thank you for using NovaHunt, you can reach out to us at contact@novahunt.ai"
- Keeps the Back to Home link and centered layout.
*/
export default function ContactPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        boxSizing: 'border-box',
        background: '#f7f7f8',
      }}
    >
      <div style={{ width: '100%', maxWidth: 820, position: 'relative' }}>
        {/* Top-right Back to Home */}
        <div style={{ position: 'absolute', right: 0, top: -8 }}>
          <a
            href="/"
            style={{
              display: 'inline-block',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #e6e6e6',
              background: '#fff',
              color: '#333',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Back to Home
          </a>
        </div>

        <section
          aria-labelledby="contact-title"
          style={{
            background: '#fff',
            border: '1px solid #eee',
            padding: 18,
            borderRadius: 8,
            boxSizing: 'border-box',
            minHeight: 120,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <header style={{ marginBottom: 8 }}>
            <h1 id="contact-title" style={{ margin: 0 }}>
              Contact Us
            </h1>
          </header>

          <div style={{ marginTop: 8 }}>
            <p style={{ color: '#444', margin: 0 }}>
              Thank you for using NovaHunt, you can reach out to us at{' '}
              <a
                href="mailto:contact@novahunt.ai"
                style={{ color: '#444', textDecoration: 'none', fontWeight: 400 }}
              >
                contact@novahunt.ai
              </a>
              .
            </p>
          </div>

          <div style={{ height: 12 }} />

          <div style={{ color: '#999', fontSize: 13, marginTop: 8 }}>
            We usually reply within 1 business day.
          </div>
        </section>
      </div>
    </main>
  );
}
