// pages/_app.js
import React from 'react';
import Layout from '../components/Layout';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  // If some pages render their own full-width layouts, they can opt-out.
  // This wraps pages by default so Footer is always present.
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
