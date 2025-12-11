import { useEffect } from 'react';
import Head from 'next/head';

/**
 * Client-side sign out helper page.
 * If your app's Sign Out link points to /signout, visiting this page will:
 * - Call /api/signout (if present)
 * - Clear local client session storage
 * - Redirect home
 */

export default function SignoutPage() {
  useEffect(() => {
    async function doSignout() {
      try {
        // attempt to call a server signout endpoint if it exists
        try {
          await fetch('/api/signout', { method: 'POST' }).catch(() => {});
        } catch (e) {}
        try { localStorage.removeItem('nh_session'); localStorage.removeItem('nh_usage'); } catch (e) {}
      } finally {
        window.location.href = '/';
      }
    }
    doSignout();
  }, []);

  return (
    <>
      <Head><title>Signing out…</title></Head>
      <main style={{ maxWidth: 700, margin: '48px auto', padding: 24 }}>
        <h1>Signing out…</h1>
        <p style={{ color: '#374151' }}>You will be redirected to the homepage shortly.</p>
      </main>
    </>
  );
}