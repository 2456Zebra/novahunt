import Head from 'next/head';
import dynamic from 'next/dynamic';
import ErrorBoundary from '../components/ErrorBoundary';
import Renderings from '../components/Renderings';

// Load SearchClient only on the client to avoid SSR/hydration errors.
const SearchClient = dynamic(() => import('../components/SearchClient'), { ssr: false });

export default function Home() {
  return (
    <>
      <Head>
        <title>NovaHunt — Find business contacts</title>
        <meta name="description" content="Search company domains to find contact emails, names and roles." />
      </Head>

      <main style={{ padding: '24px' }}>
        <h1 style={{ marginTop: 20 }}>Find business contacts from a domain</h1>
        <p style={{ color: '#6b7280' }}>Enter a company website (example: coca-cola.com) and NovaHunt will show public business contacts.</p>

        <ErrorBoundary>
          <SearchClient />
        </ErrorBoundary>

        <ErrorBoundary>
          <Renderings />
        </ErrorBoundary>
      </main>
    </>
  );
}
