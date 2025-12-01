import React from 'react';

/*
Footer
- Centers COPYRIGHT and Contact next to each other.
- Contact uses the same color, size, and weight as the copyright (not bold, not blue).
- No Privacy link.
*/
export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid #eee', padding: '20px 0', marginTop: 32 }}>
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 18px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div style={{ color: '#666', fontSize: 13, fontWeight: 400 }}>
          © {new Date().getFullYear()} NovaHunt.ai
        </div>

        <div style={{ color: '#666', fontSize: 13, fontWeight: 400 }}>
          <a href="/contact" style={{ color: '#666', textDecoration: 'none', fontWeight: 400 }}>
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
