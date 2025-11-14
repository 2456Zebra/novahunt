import dynamic from 'next/dynamic';
import Head from 'next/head';

// Simple sign-in UI — uses firebase client if you have firebase-config set up.
const SignInModal = dynamic(() => import('../SignInModal'), { ssr: false });

export default function SignInPage() {
  return (
    <>
      <Head><title>Sign in — NovaHunt</title></Head>
      <main style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
        <h1>Sign in</h1>
        <p>Sign in to save leads and manage reveals.</p>
        <SignInModal open={true} onClose={() => { window.location.href = '/'; }} />
      </main>
    </>
  );
}
