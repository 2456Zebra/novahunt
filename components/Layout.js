import React from 'react';
import Footer from './Footer';
import RightPanel from './RightPanel';

/*
  Lightweight Layout that guarantees a two-column layout with a RightPanel.
  If your pages supply a custom right panel, they can pass it via pageProps.rightPanel.
  This file intentionally keeps styles inline/global to avoid depending on external CSS that might be missing.
*/

export default function Layout({ children, pageProps = {} }) {
  return (
    <div className="site-root">
      <div className="container">
        <main className="left-panel">
          {children}
        </main>

        <div className="right-panel-wrapper">
          {pageProps.rightPanel ? pageProps.rightPanel : <RightPanel company={pageProps.company} />}
        </div>
      </div>

      <Footer />

      <style jsx global>{`
        .container {
          display: flex;
          align-items: flex-start;
          gap: 28px;
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .left-panel { flex: 1; min-width: 320px; }
        .right-panel-wrapper { width: 320px; margin-top: 0 !important; }
        a { color: #0645AD; text-decoration: underline; }
      `}</style>
    </div>
  );
}
