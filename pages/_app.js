import React, { useEffect, useState } from 'react';
import '../styles/globals.css'; // adjust if you use a different stylesheet path
import useMounted from '../lib/useMounted';

/*
  Temporary defensive _app.js:
  - Renders nothing until client mount (avoids hydration mismatch crashes)
  - Catches runtime errors with an ErrorBoundary so the app stays interactive
  - Logs errors to console for easier debugging

  Replace your existing pages/_app.js with this while you debug the root cause.
  This is a short-term mitigation — we'll still need to find and fix the real render error.
*/

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error('Unhandled render error caught by ErrorBoundary:', error, info);
    this.setState({ errorInfo: info });
    // Optionally report to a logging service here
  }
  render() {
    if (this.state.hasError) {
      // Render a minimal fallback UI but do not block other user interactions
      return (
        <div style={{ padding: 24, fontFamily:'Inter,system-ui, -apple-system, Roboto' }}>
          <h2>Something went wrong</h2>
          <p>We caught an unexpected error. Please reload the page. If the problem persists, contact support.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function MyApp({ Component, pageProps }) {
  const mounted = useMounted();

  // Wait until client mount to avoid hydration mismatches causing React invariants
  if (!mounted) {
    // Minimal SSR fallback to preserve layout quickly; avoid rendering interactive code before mount
    return <div style={{ minHeight: '60vh' }} />;
  }

  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}

export default MyApp;
