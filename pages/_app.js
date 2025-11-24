// pages/_app.js
import '../styles/globals.css';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // ✅ Approved branch and host configuration
    const GOOD_BRANCH = 'restore-good-design-f5d87fc';
    const APPROVED_HOSTS = ['novahunt-2sxouw5cx-nova-hunts-projects.vercel.app', 'your-production-domain.com'];

    // Get current branch from URL or environment (Vercel injects VERCEL_GIT_COMMIT_REF)
    const currentBranch = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF || '';

    // Get current host
    const currentHost = window.location.hostname;

    // Redirect if not approved
    if (currentBranch !== GOOD_BRANCH || !APPROVED_HOSTS.includes(currentHost)) {
      console.warn('Blocked: Unapproved branch or host detected.');
      // Optional: redirect to safe page or just block
      router.replace('/404'); // or router.replace('/') for home
    }
  }, [router]);

  return <Component {...pageProps} />;
}

export default MyApp;
