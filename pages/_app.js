import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [safeToRender, setSafeToRender] = useState(false);

  useEffect(() => {
    const allowedHost = "novahunt-2sxouw5cx-nova-hunts-projects.vercel.app";

    if (typeof window !== "undefined") {
      // Skip host check if already on /blocked
      if (router.pathname === "/blocked") {
        setSafeToRender(true);
        return;
      }

      if (window.location.host !== allowedHost) {
        window.location.replace("/blocked");
      } else {
        setSafeToRender(true);
      }
    }
  }, [router.pathname]);

  if (!safeToRender) {
    return null;
  }

  return <Component {...pageProps} />;
}

export default MyApp;
