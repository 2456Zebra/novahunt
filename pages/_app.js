// pages/_app.js
import '../styles/globals.css';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const currentProd = process.env.NEXT_PUBLIC_CURRENT_PROD_URL;
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    // Only allow rendering if on current production or not blocked
    if (typeof window !== 'undefined') {
      if (window.location.origin !== currentProd) {
        window.location.href = currentProd; // full redirect immediately
      } else {
        setCanRender(true); // safe to render good site
      }
    }
  }, [currentProd]);

  if (!canRender) return null; // prevents flash of bad design

  return <Component {...pageProps} />;
}

export default MyApp;
