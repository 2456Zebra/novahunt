// pages/_app.js
import { useEffect } from "react";
import { useRouter } from "next/router";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    const allowedHost = "novahunt-2sxouw5cx-nova-hunts-projects.vercel.app";

    // Exempt the blocked page itself from redirect
    if (
      typeof window !== "undefined" &&
      window.location.host !== allowedHost &&
      window.location.pathname !== "/blocked"
    ) {
      router.replace("/blocked");
    }
  }, [router]);

  return <Component {...pageProps} />;
}

export default MyApp;
