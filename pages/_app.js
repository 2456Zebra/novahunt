// pages/_app.js
import { useEffect } from "react";
import { useRouter } from "next/router";
import "../styles/globals.css"; // adjust if you have a different global styles file

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Define the allowed host (the good site)
    const allowedHost = "novahunt-2sxouw5cx-nova-hunts-projects.vercel.app";

    // If the current host is not the allowed host, redirect to /blocked
    if (typeof window !== "undefined" && window.location.host !== allowedHost) {
      router.replace("/blocked");
    }
  }, [router]);

  return <Component {...pageProps} />;
}

export default MyApp;
