import dynamic from 'next/dynamic';
import Head from 'next/head';
import '../styles/globals.css';

// Load Header only on client to avoid SSR/hydration mismatches
const Header = dynamic(() => import('../components/Header'), { ssr: false });

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>
      <Header />
      <Component {...pageProps} />
    </>
  );
}
