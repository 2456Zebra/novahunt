import React from 'react';
import Footer from '../components/Footer';

/*
Minimal _app.js that ensures your pages render normally and includes the Footer component site-wide.
Paste this file to pages/_app.js (overwrite existing) and redeploy.
*/
export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <style jsx global>{`
        html, body, #__next { height: 100%; }
        body { margin: 0; font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; background: #f7f7f8; color: #111; }
        a { color: inherit; text-decoration: none; }
      `}</style>

      <Component {...pageProps} />

      <Footer />
    </>
  );
}
