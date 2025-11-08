// pages/_app.js — WRAPS ALL PAGES (fixes black screen on back)
export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
