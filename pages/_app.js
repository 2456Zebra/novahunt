// pages/_app.js
import { useEffect } from "react";
import { useRouter } from "next/router";
import "../styles/globals.css"; // adjust if you have a different global styles file

function MyApp({ Component, pageProps, router }) {
  const route = useRouter();

  useEffect(() => {
    const allowedHost = "novahunt-2sxouw5cx-nova-hunts-projects.vercel.app";

    // Exempt the blocked page itself from redirect
    if (
      typeof window !== "undefined" &&
      window.location.host !== allowedHost &&
      window.location.pathname !== "/blocked"
    ) {
      route.replace("/blocked");
    }
  }, [route]);

  return <Component {...pageProps} />;
}

export default MyApp;
