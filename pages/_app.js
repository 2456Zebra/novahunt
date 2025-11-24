// _app.js
import '../styles/globals.css';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const currentProd = process.env.NEXT_PUBLIC_CURRENT_PROD_URL;
  const [allowed, setAllowed] = useState(false);

  // Early redirect if not on current production host or on /blocked
  useEffect(() => {
    const host = window.location.hostname;
    const path = window.location.pathname;

    if (path === '/blocked' || host !== new URL(currentProd).hostname) {
      window.location.replace(currentProd); // hard redirect, no flash
    } else {
      setAllowed(true); // allow rendering
    }
  }, [currentProd]);

  // Prevent any rendering until check passes
  if (!allowed) return null;

  return <Component {...pageProps} />;
}

export default MyApp;
