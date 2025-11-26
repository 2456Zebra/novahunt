// components/ErrorBoundary.jsx
import React from 'react';

// Minimal error boundary for React pages
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err) {
    console.error('ErrorBoundary caught', err);
  }
  render() {
    if (this.state.hasError) {
      return <div style={{ padding: 20, background: '#fff4f4', borderRadius: 8 }}>Something went wrong. Please refresh.</div>;
    }
    return this.props.children;
  }
}
