import React from 'react';

/*
About page (restored-style)
- Clean, neutral about page without footer duplication.
- Adds paddingBottom so the bottom link is not flush to the viewport edge.
- If you prefer I can restore an exact historical version from your git history — provide the commit SHA or I can guide you through the git UI restore.
*/
export default function AboutPage() {
  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: '0 auto', paddingBottom: 96, minHeight: '100vh', boxSizing: 'border-box' }}>
      <header style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0 }}>About NovaHunt</h1>
        <p style={{ marginTop: 8, color: '#666' }}>
          NovaHunt helps teams discover B2B contacts faster and with more confidence.
        </p>
      </header>

      <section style={{ background: '#fff', border: '1px solid #eee', padding: 18, borderRadius: 8 }}>
        <h2 style={{ marginTop: 0 }}>Our mission</h2>
        <p style={{ color: '#444' }}>
          We make prospecting faster, more reliable, and easier to scale by combining smart search, contact discovery, and simple exports.
        </p>

        <h3 style={{ marginTop: 16 }}>What we build</h3>
        <ul>
          <li>Search by domain and discover people</li>
          <li>Reveal verified emails</li>
          <li>CSV export for outreach lists</li>
        </ul>

        <h3 style={{ marginTop: 16 }}>Contact</h3>
        <p style={{ color: '#444' }}>
          Questions? Email us at <a href="mailto:support@novahunt.ai" style={{ color: '#0b74ff' }}>support@novahunt.ai</a>.
        </p>

        <div style={{ height: 28 }} />

        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
          <p style={{ color: '#999', fontSize: 13, marginTop: 8 }}>
            Built with care by the NovaHunt team.
          </p>
        </div>
      </section>
    </main>
  );
}
