import React from 'react';

/*
Footer (updated)
- Copyright fixed to 2026.
- Copyright and Contact centered next to each other with a " - " separator.
- Contact is same color, size, and weight as the copyright (not bold, not blue).
*/
export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid #eee', padding: '18px 0', marginTop: 32 }}>
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 18px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div style={{ color: '#666', fontSize: 13, fontWeight: 400 }}>
          © 2026 NovaHunt.ai
        </div>

        <div style={{ color: '#666', fontSize: 13, fontWeight: 400 }}>{"\u00A0-\u00A0"}</div>

        <div style={{ color: '#666', fontSize: 13, fontWeight: 400 }}>
          <a href="/contact" style={{ color: '#666', textDecoration: 'none', fontWeight: 400 }}>
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
