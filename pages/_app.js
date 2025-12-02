import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Footer from '../components/Footer';
import LimitModal from '../components/LimitModal';
import Header from '../components/Header';

/*
Global app wrapper:
- Renders the site Header on every page.
- Adds LimitModal so any component can dispatch limit events and have a consistent modal.
*/

export default function MyApp({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setMounted(true);
  }, []);

  return (
    <>
      <style jsx global>{`
        html, body, #__next { height: 100%; }
        body { margin: 0; font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; background: #f7f7f8; color: #111; }
        a { color: inherit; text-decoration: none; }
      `}</style>

      <Header />

      <Component {...pageProps} />

      <Footer />

      {/* Global Limit Modal */}
      <LimitModal />
    </>
  );
}
