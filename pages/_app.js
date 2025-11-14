import dynamic from 'next/dynamic';
import '../styles/globals.css';

// Load header client-side to avoid SSR/hydration mismatches
const Header = dynamic(() => import('../components/Header'), { ssr: false });

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Header />
      <Component {...pageProps} />
    </>
  );
}
