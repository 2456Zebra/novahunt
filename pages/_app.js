// Minimal pages/_app.js — no global imports, no providers, nothing that can cause hook-order or SSR mismatch.
export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
