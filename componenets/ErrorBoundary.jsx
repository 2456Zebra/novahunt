import React from 'react';

/**
 * Simple ErrorBoundary to prevent whole-page crashes from unexpected render-time exceptions.
 * Wrap problematic client-only components (SearchClient, Renderings) to surface a fallback UI.
 */

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    try {
      // Send to server logs if desired
      console.error('ErrorBoundary caught', error, info);
    } catch (e) {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" style={{ padding: 16, borderRadius: 8, background: '#fff3f2', color: '#b91c1c', marginBottom: 12 }}>
          Something went wrong rendering this part of the page. Please reload the page or try again later.
        </div>
      );
    }
    return this.props.children;
  }
}
