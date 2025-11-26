// pages/_app.js
import '../styles/theme.css';
import React from 'react';

/**
 * Simple ErrorBoundary so a single client error doesn't break the whole app.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    if (typeof console !== 'undefined') console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <main style={{ padding: 24 }}>
          <h2>Something went wrong.</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#b91c1c' }}>
            {this.state.error?.message || 'Unknown error'}
          </pre>
        </main>
      );
    }
    return this.props.children;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => { try { console.error('Window error:', e.error || e.message || e); } catch {} });
  window.addEventListener('unhandledrejection', (e) => { try { console.error('Unhandled rejection:', e.reason || e); } catch {} });
}

export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}
