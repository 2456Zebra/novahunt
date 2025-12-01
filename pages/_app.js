// Minimal Next.js app wrapper — NO header, NO ClientAuthHeader injection.
// Keeps a small global style block but otherwise renders your pages exactly as they are.
import React from 'react';

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <style jsx global>{`
        html, body, #__next { height: 100%; }
        body { margin: 0; font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; background: #f7f7f8; }
        a { color: inherit; text-decoration: none; }
      `}</style>
      <Component {...pageProps} />
    </>
  );
}
