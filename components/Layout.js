import React from 'react';
import Footer from './Footer';

/*
  Simple layout wrapper that aligns left and right panels.
  Use this in pages/_app.js or wrap pages that need two-column layout.
*/

export default function Layout({ children }) {
  return (
    <div className="site-root">
      <div className="container">
        {children}
      </div>
      <Footer />
      <style jsx global>{`
        .container {
          display: flex;
          align-items: flex-start;
          gap: 24px;
          padding: 24px;
        }
        .left-panel { flex: 1; min-width: 300px; }
        .right-panel { width: 320px; margin-top: 0 !important; }
        a { color: #0645AD; text-decoration: underline; }
        .upgrade-button { padding: 10px 14px; border-radius: 6px; }
      `}</style>
    </div>
  );
}
