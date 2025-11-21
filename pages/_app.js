import { useEffect } from 'react';
import Head from 'next/head';

/**
 * Global app wrapper:
 * - Listens for nh-signed-in and nh-signed-out events and redirects to homepage to avoid landing on broken pages.
 * - This is intentionally conservative: after sign-in/out we send the user to '/' so they land on a known-good page.
 */

export default function App({ Component, pageProps }) {
  useEffect(() => {
    function onSignedIn() {
      try {
        // Safe redirect to homepage after sign-in to avoid 404 redirect loops
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      } catch (e) {
        // ignore
      }
    }
    function onSignedOut() {
      try {
        if (typeof window !== 'undefined') {
          // clear client session and go home
          try { localStorage.removeItem('nh_session'); localStorage.removeItem('nh_usage'); } catch (e) {}
          window.location.href = '/';
        }
      } catch (e) {}
    }

    window.addEventListener('nh-signed-in', onSignedIn);
    window.addEventListener('nh-signed-out', onSignedOut);

    return () => {
      window.removeEventListener('nh-signed-in', onSignedIn);
      window.removeEventListener('nh-signed-out', onSignedOut);
    };
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}