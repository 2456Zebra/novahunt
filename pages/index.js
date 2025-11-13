import dynamic from 'next/dynamic';
import Head from 'next/head';

// Load the search widget client-side only to avoid SSR/hydration mismatches.
const SearchClient = dynamic(() => import('../components/SearchClient'), { ssr: false });

export default function Home() {
  return (
    <>
      <Head>
        <title>NovaHunt</title>
      </Head>

      <main style={{ padding: '2rem' }}>
        <h1>NovaHunt</h1>
        <p style={{ maxWidth: 900 }}>
          Enter a company domain to search for corporate emails (powered by Hunter). Start with a few
          domains under the free plan while you iterate.
        </p>

        <SearchClient />
      </main>
    </>
  );
}
