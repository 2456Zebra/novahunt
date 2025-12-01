import React from 'react';

/*
Contact page (updated per request)
- Removes the Office block.
- Updates email to contact@novahunt.ai.
- Moves "We usually reply within 1 business day." higher.
- Makes the contact card shorter / less tall.
- Adds a "Back to Home" link in the top-right of the page container.
- Centers the whole Contact content on the page.
- Keeps footer separate (Footer component).
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
            // reduced vertical size
            minHeight: 160,
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

          <p style={{ marginTop: 6, color: '#666' }}>
            We usually reply within 1 business day.
          </p>

          <div style={{ marginTop: 12 }}>
            <p style={{ color: '#444', margin: 0 }}>
              For support and billing inquiries, email:
              {' '}
              <a
                href="mailto:contact@novahunt.ai"
                style={{ color: '#666', textDecoration: 'none', fontWeight: 400 }}
              >
                contact@novahunt.ai
              </a>
            </p>
          </div>

          <div style={{ height: 12 }} />

          <div style={{ color: '#999', fontSize: 13, marginTop: 8 }}>
            {/* kept short, no extra office block */}
            Thank you — we look forward to helping you.
          </div>
        </section>
      </div>
    </main>
  );
}
