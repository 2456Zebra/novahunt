import dynamic from 'next/dynamic';
import Head from 'next/head';

// Client-only search widget to avoid SSR/hydrate mismatches
const SearchClient = dynamic(() => import('../components/SearchClient'), { ssr: false });

export default function Home() {
  return (
    <>
      <Head>
        <title>NovaHunt — Find contacts</title>
      </Head>

      <main style={{ padding: '2rem', maxWidth: 980, margin: '0 auto' }}>
        <h1 style={{ marginTop: 0 }}>Find contacts</h1>
        <p style={{ color: '#374151', maxWidth: 900 }}>
          Enter a website to find agency or company contacts. We show names, job titles and a trust score so you can decide who to reach out to.
        </p>

        <SearchClient />
      </main>
    </>
  );
}
