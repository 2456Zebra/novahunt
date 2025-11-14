import dynamic from 'next/dynamic';
import Head from 'next/head';

const SignInModal = dynamic(() => import('../SignInModal'), { ssr: false });

export default function SignUpPage() {
  return (
    <>
      <Head><title>Create account — NovaHunt</title></Head>
      <main style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
        <h1>Create an account</h1>
        <p>Create an account to save leads and track reveals.</p>
        <SignInModal open={true} initialMode="signup" onClose={() => { /* keep on same page for demo; add redirect after real auth */ }} />
      </main>
    </>
  );
}
