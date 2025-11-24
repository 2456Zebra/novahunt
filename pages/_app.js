import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [safeToRender, setSafeToRender] = useState(false);

  useEffect(() => {
    const allowedHost = "novahunt-2sxouw5cx-nova-hunts-projects.vercel.app";

    if (typeof window !== "undefined") {
      if (window.location.host !== allowedHost) {
        // Immediately redirect to /blocked without rendering anything else
        window.location.replace("/blocked");
      } else {
        // Allowed host, safe to render the page
        setSafeToRender(true);
      }
    }
  }, []);

  // Prevent any page flash until the host check completes
  if (!safeToRender) {
    return null;
  }

  return <Component {...pageProps} />;
}

export default MyApp;
