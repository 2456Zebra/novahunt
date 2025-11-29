import React from 'react';
import Footer from './Footer';

/*
  Simple layout wrapper that aligns left and right panels.
  Use this in your pages/_app.js or in pages that render the two-column layout.
*/

export default function Layout({ children }) {
  return (
    <div className="site-root">
      <div className="container">
        {children}
      </div>
      <Footer />
      <style jsx global>{`
        /* Ensure top alignment for left/right columns and default link styles */
        .container {
          display: flex;
          align-items: flex-start; /* important: aligns panels at top */
          gap: 24px;
          padding: 24px;
        }

        /* If you have specific selectors for left/right, adapt these */
        .left-panel {
          flex: 1;
          min-width: 300px;
        }
        .right-panel {
          width: 320px;
          /* remove any stray margin-top that would offset it */
          margin-top: 0 !important;
        }

        /* Restore blue underline for test-drive-type links */
        a.test-drive, a.testdrive, a.test-drive-link {
          color: #0645AD;
          text-decoration: underline;
        }

        /* Generic link rule to keep classic style unless overridden */
        a {
          color: #0645AD;
          text-decoration: underline;
        }

        /* small helper for upgrade button spacing */
        .upgrade-button {
          padding: 10px 14px;
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
}
