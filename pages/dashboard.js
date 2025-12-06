// Redirect /dashboard to /account — keeps backward compatibility.
// Replace any existing dashboard page with this file.
export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/account',
      permanent: false,
    },
  };
}

export default function DashboardRedirect() {
  return null;
}
