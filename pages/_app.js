import dynamic from 'next/dynamic';
import Head from 'next/head';
import '../styles/globals.css';

// Load Header only on the client to avoid SSR/hydration mismatch
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
