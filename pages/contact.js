import React from 'react';

/*
Contact page
- Clean contact content only.
- Copyright/contact moved to the Footer component (do not duplicate here).
- Adds comfortable spacing so the footer is not overlapping / the page doesn't end abruptly.
*/
export default function ContactPage() {
  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: '0 auto', paddingBottom: 96, minHeight: '100vh', boxSizing: 'border-box' }}>
      <header style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0 }}>Contact Us</h1>
        <p style={{ marginTop: 8, color: '#666' }}>
          Need help or want to provide feedback? Reach out and we’ll get back to you as soon as possible.
        </p>
      </header>

      <section style={{ background: '#fff', border: '1px solid #eee', padding: 18, borderRadius: 8 }}>
        <h2 style={{ marginTop: 0 }}>Get in touch</h2>

        <p style={{ color: '#444' }}>
          For support and billing inquiries, email: <a href="mailto:support@novahunt.ai" style={{ color: '#0b74ff' }}>support@novahunt.ai</a>
        </p>

        <h3 style={{ marginTop: 16 }}>Office</h3>
        <p style={{ color: '#444' }}>
          NovaHunt.ai
          <br />
          San Francisco, CA (remote friendly)
        </p>

        <div style={{ height: 28 }} />

        <p style={{ color: '#999', fontSize: 13 }}>
          We usually reply within 1 business day.
        </p>
      </section>
    </main>
  );
}
