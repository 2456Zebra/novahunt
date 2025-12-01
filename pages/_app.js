import React from 'react';
import ClientAuthHeader from '../components/ClientAuthHeader';

/*
  Optional _app.js you can use if your project doesn't have its own custom _app.js.
  If you already have pages/_app.js, instead import <ClientAuthHeader /> into your existing header markup.
*/
export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <style jsx global>{`
        body { margin: 0; font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; background: #f7f7f8; }
        a { color: inherit; }
      `}</style>

      <header style={{ padding: '14px 24px', borderBottom: '1px solid rgba(0,0,0,0.04)', background: 'transparent' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <a href="/" style={{ textDecoration: 'none', color: '#111', fontWeight: 800, fontSize: 18 }}>NovaHunt</a>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <ClientAuthHeader />
          </div>
        </div>
      </header>

      <Component {...pageProps} />
    </>
  );
}
