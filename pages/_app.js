import React from 'react';
import dynamic from 'next/dynamic';
import Footer from '../components/Footer';

/*
pages/_app.js (replacement)

Purpose:
- Prevent a crashing component from taking down the whole client UI (that React invariant #418 is currently doing).
- Ensure the header that reads localStorage (HeaderButtons) always mounts client-side (no SSR) so signing-up/signing-in immediately shows the user info.
- Add an Error Boundary around the page content so runtime render errors don't stop the header or prevent the user from interacting with Account/Logout.

What I changed / why:
- HeaderButtons is dynamically imported with ssr: false so it only runs on the client and can't cause SSR/hydration mismatches.
- An ErrorBoundary class wraps the main Component so if a child throws during render, we surface a safe fallback and keep HeaderButtons + Footer functional.
- Global minimal styles are preserved (similar to your previous _app.js) so the look doesn't regress.
- This file is self-contained and minimal to reduce new surface area for errors.

Deployment notes:
- Back up your existing pages/_app.js before overwriting.
- Commit & push to add/stripe-checkout-fix and redeploy to Vercel.
- Hard-refresh the site (Cmd/Ctrl+Shift+R) after deploy.
- Then sign up and verify the header shows immediately.

If the header still doesn't show after this deploy:
- Confirm localStorage keys exist (nh_user_email, nh_usage, nh_usage_last_update).
- Paste the first React error stack (if any) and I will produce the precise fix.

*/

// Load header client-side only, prevents SSR/hydration mismatch and isolates header runtime
const HeaderButtons = dynamic(() => import('../HeaderButtons'), {
  ssr: false,
  loading: () => null,
});

// Simple Error Boundary to isolate page-level rendering errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // You can report the error to an error service here
    // Example: fetch('/api/log-client-error', { method: 'POST', body: JSON.stringify({ error: String(error), info }) })
    this.setState({ info });
    // still log to console for debugging
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
              An unexpected error occurred while rendering this page. The site should still be usable — you can access your account via the header or try refreshing the page.
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
  return (
    <>
      {/* Global minimal styles */}
      <style jsx global>{`
        html, body, #__next { height: 100%; }
        body { margin: 0; font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; background: #f7f7f8; color: #111; }
        a { color: inherit; text-decoration: none; }
      `}</style>

      {/* HeaderButtons is outside the ErrorBoundary so header remains even if page errors */}
      <header style={{ width: '100%', padding: '12px 20px', boxSizing: 'border-box', background: '#fff', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" aria-label="NovaHunt home" style={{ fontWeight: 700, color: '#111', fontSize: 16 }}>NovaHunt</a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <HeaderButtons />
          </div>
        </div>
      </header>

      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>

      <Footer />
    </>
  );
}
