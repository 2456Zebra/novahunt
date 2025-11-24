import { useState, useEffect } from "react";
import "../styles/globals.css";

function MyApp({ Component, pageProps, hostAllowed }) {
  const [allowed, setAllowed] = useState(hostAllowed);

  useEffect(() => {
    const allowedHost = "novahunt-dxf7v1h9v-nova-hunts-projects.vercel.app";

    if (!allowed) {
      // Client-side fallback redirect if somehow it got here
      window.location.replace(`https://${allowedHost}/blocked`);
    }
  }, [allowed]);

  // If host is not allowed, render nothing
  if (!allowed) return null;

  return <Component {...pageProps} />;
}

// Check host on server-side to prevent flash
MyApp.getInitialProps = async ({ ctx }) => {
  const allowedHost = "novahunt-dxf7v1h9v-nova-hunts-projects.vercel.app";
  const host = ctx.req ? ctx.req.headers.host : window.location.host;

  return { hostAllowed: host === allowedHost };
};

export default MyApp;
