import Head from 'next/head';
import HeroLiveDemo from '../components/HeroLiveDemo';

export default function Home() {
  return (
    <>
      <Head>
        <title>NovaHunt</title>
        <meta name="description" content="Find business emails instantly." />
      </Head>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
        <header style={{ marginBottom: 18 }}>
          <h1 style={{ margin: 0 }}>NovaHunt</h1>
          <p style={{ color: '#6b7280' }}>
            Find business emails instantly. Enter a company domain, and get professional email results.
          </p>
        </header>

        <section>
          <HeroLiveDemo initial="coca-cola.com" />
        </section>
      </main>
    </>
  );
}
