// pages/_app.js
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  const currentProd = process.env.NEXT_PUBLIC_CURRENT_PROD_URL;

  if (typeof window !== 'undefined') {
    // Redirect immediately if the host isn't the good production
    if (window.location.origin !== currentProd || window.location.pathname === '/blocked') {
      window.location.href = currentProd;
      return null; // prevent any old site from rendering
    }
  }

  return <Component {...pageProps} />;
}

export default MyApp;
