import React from 'react';

/*
 Minimal Header: renders only the nav links, minimal styling, no brand.
 Replace your header with this file if you want just links at the top.
*/
export default function Header() {
  return (
    <header style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '10px 12px',
      borderBottom: '1px solid transparent',
      background: 'transparent'
    }}>
      <nav style={{ display: 'flex', gap: '14px', fontSize: 14 }}>
        <a href="/" style={{ color: '#0645AD', textDecoration: 'underline' }}>Home</a>
        <a href="/plans" style={{ color: '#0645AD', textDecoration: 'underline' }}>Plans</a>
        <a href="/about" style={{ color: '#0645AD', textDecoration: 'underline' }}>About</a>
        <a href="/signin" style={{ color: '#0645AD', textDecoration: 'underline' }}>SignIn</a>
        <a href="/signup" style={{ color: '#0645AD', textDecoration: 'underline' }}>SignUp</a>
        <a href="/contacts" style={{ color: '#0645AD', textDecoration: 'underline' }}>Contacts</a>
      </nav>
    </header>
  );
}
