import dynamic from 'next/dynamic';
import Head from 'next/head';
import '../styles/globals.css';
import Header from '../components/Header'; // ensures header is shown on every page

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
