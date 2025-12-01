import React from 'react';

/*
Restore-style About page.
If you prefer to restore your original from Git, follow the restore steps below instead of pasting this file.
This version preserves spacing at the bottom and includes the footer area.
*/
export default function AboutPage() {
  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: '0 auto', paddingBottom: 96, minHeight: '100vh', boxSizing: 'border-box' }}>
      <header style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0 }}>About NovaHunt</h1>
        <p style={{ marginTop: 8, color: '#666' }}>
          NovaHunt helps you find B2B contacts quickly using AI and smart search.
        </p>
      </header>

      <section style={{ background: '#fff', border: '1px solid #eee', padding: 18, borderRadius: 8 }}>
        <h2 style={{ marginTop: 0 }}>Our mission</h2>
        <p style={{ color: '#444' }}>
          We want to make prospecting fast and reliable. Our team builds tools that let you find contacts, export lists, and manage outreach without manual guesswork.
        </p>

        <h3 style={{ marginTop: 16 }}>Features</h3>
        <ul>
          <li>AI-powered contact discovery</li>
          <li>Bulk search and reveal</li>
          <li>CSV export and integrations</li>
        </ul>

        <h3 style={{ marginTop: 16 }}>Contact</h3>
        <p style={{ color: '#444' }}>
          For questions, reach out at <a href="mailto:support@novahunt.ai">support@novahunt.ai</a>.
        </p>

        <div style={{ height: 28 }} />

        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
          <a
            href="/privacy"
            style={{ display: 'inline-block', color: '#0b74ff', fontWeight: 700, marginBottom: 24 }}
          >
            Privacy policy
          </a>
          <div style={{ height: 28 }} />
          <p style={{ color: '#999', fontSize: 13, marginTop: 8 }}>
            © {new Date().getFullYear()} NovaHunt.ai — All rights reserved.
          </p>
        </div>
      </section>
    </main>
  );
}
