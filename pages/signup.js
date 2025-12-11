// pages/signup.js
// Server-side redirect: send any visits to /signup -> /plans
// Safe temporary file to avoid importing Supabase until you're ready.

export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/plans',
      permanent: false,
    },
  };
}

export default function SignupRedirect() {
  // never rendered because of redirect
  return null;
}
