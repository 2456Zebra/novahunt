// pages/_app.js
// Minimal custom App to wrap the site in a global error boundary to avoid an uncaught client exception from taking down the whole page.
import React from 'react';
import App from 'next/app';
import ErrorBoundary from '../components/ErrorBoundary';

class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props;
    return (
      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>
    );
  }
}

export default MyApp;
