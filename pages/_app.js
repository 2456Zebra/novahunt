// pages/_app.js
// Minimal app wrapper: remove any global header to avoid duplicate headers rendered by individual pages.
// Keeps ErrorBoundary and site footer.

import React from 'react';
import App from 'next/app';
import ErrorBoundary from '../components/ErrorBoundary';

function Footer() {
  return (
    <footer style={{ marginTop:40, padding:20, borderTop:'1px solid #e6edf3', background:'#fbfcfd', textAlign:'center', color:'#6b7280', fontSize:13 }}>
      <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
        <div>© 2026 NovaHunt</div>
        <div style={{ display:'flex', gap:12 }}>
          <a href="/terms" style={{ color:'#6b7280', textDecoration:'underline' }}>Terms</a>
          <a href="/privacy" style={{ color:'#6b7280', textDecoration:'underline' }}>Privacy</a>
          <a href="/contact" style={{ color:'#6b7280', textDecoration:'underline' }}>Contact</a>
        </div>
      </div>
    </footer>
  );
}

class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props;
    return (
      <ErrorBoundary>
        <Component {...pageProps} />
        <Footer />
      </ErrorBoundary>
    );
  }
}

export default MyApp;
