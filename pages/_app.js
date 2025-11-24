import { useEffect } from "react";
import { useRouter } from "next/router";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Only allow the good host
    const allowedHost = "novahunt-dxf7v1h9v-nova-hunts-projects.vercel.app";

    if (window.location.host !== allowedHost) {
      // Redirect immediately to the blocked page on the good site
      window.location.replace(`https://${allowedHost}/blocked`);
    }
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
