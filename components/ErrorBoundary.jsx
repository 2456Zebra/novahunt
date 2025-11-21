import React from 'react';

/**
 * Minimal ErrorBoundary used by pages/index.js
 * Avoids unescaped apostrophes (use "We are" instead of "We're") to satisfy lint.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught error:', error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" style={{ padding: 20, background: '#fee2e2', color: '#b91c1c', borderRadius: 8 }}>
          <h3>Something went wrong.</h3>
          <p>We are working on it. Please try again later.</p>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {String(this.state.error)}
            {this.state.info ? `\n\n${JSON.stringify(this.state.info)}` : ''}
          </details>
        </div>
      );
    }
    return this.props.children || null;
  }
}
