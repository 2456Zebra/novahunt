import React from 'react';
import Footer from './Footer';
import RightPanel from './RightPanel';

/*
 Layout renders a two-column container and the Footer.
 It includes a RightPanel by default so the company profile/link is visible.
 If a page wants a different right panel, it can override by passing pageProps.rightPanel (advanced).
*/

export default function Layout({ children, pageProps = {} }) {
  // children expected to be the left/main content
  return (
    <div className="site-root">
      <div className="container">
        <main className="left-panel">
          {children}
        </main>

        {/* RightPanel: either page-provided or the generic one */}
        <div className="right-panel-wrapper">
          {pageProps.rightPanel ? pageProps.rightPanel : <RightPanel company={pageProps.company} />}
        </div>
      </div>

      <Footer />

      <style jsx global>{`
        /* Keep left & right aligned at top and readable */
        .container {
          display: flex;
          align-items: flex-start; /* important */
          gap: 28px;
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .left-panel { flex: 1; min-width: 320px; }
        .right-panel-wrapper { width: 320px; margin-top: 0 !important; }

        /* Test-drive prompt size */
        .test-drive-prompt, .test-drive {
          font-size: 18px;
          line-height: 1.4;
        }

        /* Restore default link appearance (blue + underline) unless overridden */
        a { color: #0645AD; text-decoration: underline; }

        /* Upgrade button spacing */
        .upgrade-button { padding: 10px 14px; border-radius: 6px; }
      `}</style>
    </div>
  );
}
