import React from 'react';
import '../styles/globals.css'; // adjust if you use a different stylesheet path
import useMounted from '../lib/useMounted';

/*
  Defensive _app.js:
  - Waits until client mount before rendering interactive app (helps avoid hydration mismatch)
  - Catches render errors with an ErrorBoundary so the app remains interactive
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
  }
  render() {
    if (this.state.hasError) {
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
    return <div style={{ minHeight: '60vh' }} />;
  }

  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}

export default MyApp;
