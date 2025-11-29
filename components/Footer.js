import React from 'react';

export default function Footer() {
  return (
    <footer style={{
      padding: '18px 24px',
      borderTop: '1px solid #e6e6e6',
      textAlign: 'center',
      fontSize: '14px',
      color: '#666'
    }}>
      <div>
        © {new Date().getFullYear()} NovaHunt — <a href="/terms">Terms</a> · <a href="/privacy">Privacy</a>
      </div>
    </footer>
  );
}
