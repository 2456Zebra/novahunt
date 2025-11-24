// _app.js
import '../styles/globals.css';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const currentProd = process.env.NEXT_PUBLIC_CURRENT_PROD_URL;

  useEffect(() => {
    // Only redirect from blocked page to current production
    if (router.pathname === '/blocked') {
      router.replace(currentProd); // safe redirect
    }
  }, [router, currentProd]);

  return <Component {...pageProps} />;
}

export default MyApp;
