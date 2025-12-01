import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Footer from '../components/Footer';

/*
pages/_app.js (updated)

Behavior:
- The top header (HeaderButtons) is now only rendered for signed-in users.
- Signed-in detection is client-side only (reads localStorage key 'nh_user_email').
- The file still uses an Error Boundary to prevent page-level render errors from taking down the whole UI.
- HeaderButtons is loaded client-side only (ssr: false) to avoid SSR/hydration mismatches.

How it works:
- On the client we read localStorage.getItem('nh_user_email') after mount.
- If a user email exists, we render the header (brand + HeaderButtons).
- If no user email exists, no header is rendered (homepage and pages remain header-free for anonymous visitors).
- The code listens to storage events so sign-in / sign-out in another tab (or the signup flow that sets localStorage) will immediately cause the header to appear/disappear.

Why this change:
- You asked that the header not appear for anonymous users. This makes the header conditional on the client-side sign-in marker and keeps the rest of the app wrapped in an ErrorBoundary so runtime errors won't block core behavior.

Deploy notes:
- Back up your existing pages/_app.js before overwriting.
- Commit & push to add/stripe-checkout-fix and redeploy.
- Hard-refresh the site after deploy (Cmd/Ctrl+Shift+R).
*/

const HeaderButtons = dynamic(() => import('../HeaderButtons'), {
  ssr: false,
  loading: () => null,
});

// ErrorBoundary (same as previous)
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

  // read client-side sign-in marker after mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setMounted(true);

    const read = () => {
      try {
        const e = localStorage.getItem('nh_user_email');
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

      {/* Only render the header if we're on the client and a user is signed in */}
      {mounted && userEmail ? (
        <header style={{ width: '100%', padding: '12px 20px', boxSizing: 'border-box', background: '#fff', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <a href="/" aria-label="NovaHunt home" style={{ fontWeight: 700, color: '#111', fontSize: 16 }}>NovaHunt</a>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <HeaderButtons />
            </div>
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
