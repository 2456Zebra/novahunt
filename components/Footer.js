import React from 'react';

/*
Footer component
- Minimal site footer with copyright 2026 and contact link.
- Drop into your layout (for example at the bottom of pages/_app.js or inside your global footer area).
*/

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid #eee', padding: '20px 0', marginTop: 32, background: 'transparent' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#666', fontSize: 13 }}>
          © 2026 NovaHunt.ai
        </div>

        <div>
          <a href="/contact" style={{ color: '#0b74ff', fontWeight: 700, marginRight: 12 }}>Contact</a>
          <a href="/privacy" style={{ color: '#666' }}>Privacy</a>
        </div>
      </div>
    </footer>
  );
}
