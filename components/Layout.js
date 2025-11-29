import React from 'react';
import Header from './Header';
import Footer from './Footer';
import RightPanel from './RightPanel';

/*
  Main Layout: single source-of-truth for the right panel (prevents duplicates).
  Pages that previously rendered RightPanel themselves should remove their local RightPanel render.
*/
export default function Layout({ children, pageProps = {} }) {
  return (
    <div className="site-root">
      <Header />
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
        html,body,#__next{ height:100%; margin:0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; color:#111; }
        .container{ display:flex; align-items:flex-start; gap:28px; padding:24px; max-width:1200px; margin:0 auto; }
        .left-panel{ flex:1; min-width:320px; }
        .right-panel-wrapper{ width:320px; margin-top:0 !important; }
        a{ color:#0645AD; text-decoration:underline; }
        .test-drive-prompt{ font-size:18px; font-weight:500; margin-bottom:12px; }
        .forgot-link{ text-decoration:underline; text-decoration-thickness:1px; text-underline-offset:2px; color:#0645AD; }
      `}</style>
    </div>
  );
}
