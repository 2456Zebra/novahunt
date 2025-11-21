import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>NovaHunt — Find business contacts</title>
        <meta name="description" content="Search company domains to find contact emails, names and roles." />
      </Head>

      <main style={{ padding: 24 }}>
        <h1>NovaHunt</h1>
        <p>Search company domains to find contact emails (temporary safe fallback).</p>
      </main>
    </>
  );
}
