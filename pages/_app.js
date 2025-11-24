// pages/_app.js
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  const currentProd = process.env.NEXT_PUBLIC_CURRENT_PROD_URL;

  // Prevent any rendering on wrong host
  if (typeof window !== 'undefined' && window.location.origin !== currentProd) {
    window.location.href = currentProd; // full redirect immediately
    return null; // nothing renders while redirecting
  }

  return <Component {...pageProps} />;
}

export default MyApp;
