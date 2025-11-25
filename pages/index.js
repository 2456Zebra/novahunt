import Head from 'next/head';
import Header from '../components/Header';
import SearchClient from '../components/SearchClient';

export default function Home() {
  return (
    <>
      <Head>
        <title>NovaHunt — Find business contacts</title>
        <meta name="description" content="Search company domains to find contact emails, names and roles." />
      </Head>
      <Header />
      <main style={{ padding: '24px' }}>
        <h1 style={{ marginTop: 20 }}>Find business contacts from a domain</h1>
        <p style={{ color: '#6B7280' }}>
          Enter a company website (example: coca-cola.com) and NovaHunt will show public business contacts.
        </p>
        <div style={{ marginTop: 20 }}>
          <SearchClient />
        </div>
      </main>
    </>
  );
}
