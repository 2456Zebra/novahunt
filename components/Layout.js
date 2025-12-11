import React from 'react';
import Footer from './Footer';

/*
  Minimal Layout: renders only the main container + footer.
  Pages are responsible for rendering their own header/nav and RightPanel (prevents duplicates).
*/
export default function Layout({ children }) {
  return (
    <div className="site-root">
      <div className="container">
        <main className="left-panel">
          {children}
        </main>
      </div>

      <Footer />

      <style jsx global>{`
        html,body,#__next{ height:100%; margin:0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; color:#111; }
        .container{ display:flex; align-items:flex-start; gap:28px; padding:24px; max-width:1200px; margin:0 auto; }
        .left-panel{ flex:1; min-width:320px; }
        a{ color:#0645AD; text-decoration:underline; }
        .test-drive-prompt{ font-size:18px; font-weight:500; margin-bottom:12px; }
        .forgot-link{ text-decoration:underline; text-decoration-thickness:1px; text-underline-offset:2px; color:#0645AD; }
      `}</style>
    </div>
  );
}
