import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Footer from '../components/Footer';
import { getClientEmail } from '../lib/auth-client';

/*
pages/_app.js

Behavior:
- No top header is rendered for anonymous visitors.
- After client-side mount, if nh_user_email is present the header appears.
- The header is minimal: it only contains the right-aligned HeaderButtons (email + dropdown).
- HeaderButtons is loaded client-side only (ssr: false) so it won't run during SSR/hydration.
- ErrorBoundary wraps page content so page errors don't break the header when it is shown.
*/

const HeaderButtons = dynamic(() => import('../HeaderButtons'), {
  ssr: false,
  loading: () => null,
});

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    // eslint-disable-next-line no-console
    console.error('Client Error Boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main style={{ padding: 24, maxWidth: 980, margin: '0 auto' }}>
          <div style={{ background: '#fff', border: '1px solid #eee', padding: 18, borderRadius: 8 }}>
            <h2 style={{ marginTop: 0 }}>Something went wrong</h2>
            <p style={{ color: '#444' }}>
              An unexpected error occurred while rendering this page. The site should still be usable — try refreshing the page.
            </p>
            <details style={{ color: '#666', marginTop: 12 }}>
              <summary style={{ cursor: 'pointer' }}>Technical details (expand)</summary>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{String(this.state.error)}</pre>
              {this.state.info && <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(this.state.info, null, 2)}</pre>}
            </details>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default function MyApp({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setMounted(true);

    const read = () => {
      try {
        const e = getClientEmail();
        setUserEmail(e || null);
      } catch (err) {
        setUserEmail(null);
      }
    };

    read();

    const onStorage = (e) => {
      if (!e) return;
      if (e.key === 'nh_user_email' || e.key === 'nh_usage' || e.key === 'nh_usage_last_update') {
        read();
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <>
      <style jsx global>{`
        html, body, #__next { height: 100%; }
        body { margin: 0; font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; background: #f7f7f8; color: #111; }
        a { color: inherit; text-decoration: none; }
      `}</style>

      {/* Render header ONLY when client mounted and a user email exists */}
      {mounted && userEmail ? (
        <header style={{ width: '100%', padding: '12px 20px', boxSizing: 'border-box', background: '#fff', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <HeaderButtons />
          </div>
        </header>
      ) : null}

      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>

      <Footer />
    </>
  );
}
