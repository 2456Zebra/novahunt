// /pages/_app.js
import { useEffect } from "react";
import { useRouter } from "next/router";
import "../styles/globals.css"; // make sure to keep your global styles

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Only allow the "good design" branch
    const currentBranch = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF;
    const allowedBranch = "restore-good-design-f5d87fc";

    if (currentBranch !== allowedBranch) {
      // Redirect to home or any safe page
      router.replace("/");
    }
  }, [router]);

  return <Component {...pageProps} />;
}

export default MyApp;
