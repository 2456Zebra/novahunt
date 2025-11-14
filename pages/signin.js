import dynamic from 'next/dynamic';
import Head from 'next/head';

// Client-only dynamic import for the modal
const SignInModal = dynamic(() => import('../SignInModal'), { ssr: false });

export default function SignInPage() {
  return (
    <>
      <Head><title>Sign in — NovaHunt</title></Head>
      <main style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
        <h1>Sign in</h1>
        <p>Sign in to save leads and manage reveals.</p>
        <SignInModal open={true} initialMode="signin" onClose={() => { /* placeholder */ }} />
      </main>
    </>
  );
}
