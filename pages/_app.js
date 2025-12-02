import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Footer from '../components/Footer';
import { getClientEmail, canReveal, setClientSignedIn, incrementReveal, recordReveal, getClientUsage } from '../lib/auth-client';
import Router from 'next/router';

/*
pages/_app.js
- No header for anonymous users
- Delegated reveal click handler (installed in capture phase) so it reliably intercepts clicks on elements
  with data-nh-reveal and prevents navigation to /plans when the user is signed in and within quota.
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

  // Delegated click handler for legacy/new Reveal controls (capture phase)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    async function delegatedRevealHandler(e) {
      const el = e.target.closest && e.target.closest('[data-nh-reveal]');
      if (!el) return;
      // We are in capture phase: prevent default navigation here
      try { e.preventDefault(); } catch (err) {}
      e.stopPropagation();

      const target = el.getAttribute('data-nh-reveal') || el.dataset.target || el.dataset.nhReveal;
      if (!target) return;

      // If not signed in => go to Plans (product requirement)
      const email = getClientEmail();
      if (!email) {
        Router.push('/plans');
        return;
      }

      // Client-side quota check
      if (!canReveal()) {
        Router.push('/plans');
        return;
      }

      // Do reveal via server API (matches RevealButton behavior)
      el.disabled = true;
      try {
        const res = await fetch('/api/reveal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target }),
          credentials: 'include',
        });

        if (res.status === 402) {
          Router.push('/plans');
          return;
        }

        const body = await res.json();
        if (!res.ok) {
          throw new Error(body?.error || 'Reveal failed');
        }

        // If server returned authoritative usage, persist it; otherwise increment locally
        const serverUsage = body?.usage || (body && body.data && body.data.usage);
        if (serverUsage) {
          setClientSignedIn(email, serverUsage);
        } else {
          incrementReveal();
        }

        // record a reveal history entry (local)
        recordReveal({ target, date: new Date().toISOString(), note: (body && body.data && body.data.note) || '' });

        if (el.hasAttribute('data-nh-reload')) window.location.reload();
      } catch (err) {
        console.error('Reveal failed', err);
        alert(err.message || 'Reveal failed. Try again.');
      } finally {
        el.disabled = false;
      }
    }

    // NOTE: use capture = true so we run before navigation/other handlers
    document.addEventListener('click', delegatedRevealHandler, true);
    return () => document.removeEventListener('click', delegatedRevealHandler, true);
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
