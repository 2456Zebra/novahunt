import { useEffect } from 'react';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    const GOOD_HOST = "novahunt-2sxouw5cx-nova-hunts-projects.vercel.app";

    if (window.location.host !== GOOD_HOST) {
      console.error(
        `⚠️ You are not on the good deployment! Current host: ${window.location.host}`
      );

      // Optional: redirect automatically to good deployment
      window.location.href = `https://${GOOD_HOST}${window.location.pathname}`;
    }
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
