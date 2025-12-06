import jwt from 'jsonwebtoken';
import Header from '../components/Header';

/**
 * Account page (server rendered)
 * - Reads auth cookie on the server, verifies JWT and passes user to page.
 * - Renders Header (account header moved here).
 */
export default function AccountPage({ user }) {
  return (
    <div>
      <Header />
      <main style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
        <h1>Account</h1>
        <p>Signed in as <strong>{user?.email}</strong></p>

        <section style={{ marginTop: 18 }}>
          <h2>Plan & Usage</h2>
          <p>See your current plan limits and usage in the header dropdown.</p>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2>Profile</h2>
          <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 6 }}>
            <div><strong>Email:</strong> {user?.email}</div>
            <div style={{ marginTop: 6 }}><strong>User ID:</strong> {user?.id}</div>
          </div>
        </section>
      </main>
    </div>
  );
}

export async function getServerSideProps({ req, res, resolvedUrl }) {
  const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret-change-me';
  const token = (req.cookies && req.cookies.auth) || null;

  if (!token) {
    return {
      redirect: {
        destination: `/signin?redirect=${encodeURIComponent(resolvedUrl || '/account')}`,
        permanent: false,
      },
    };
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = { id: payload.sub, email: payload.email || null };
    return { props: { user } };
  } catch (err) {
    // Clear cookie and redirect to signin
    res.setHeader('Set-Cookie', [
      'auth=deleted; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax'
    ].join('; '));
    return {
      redirect: {
        destination: `/signin?redirect=${encodeURIComponent(resolvedUrl || '/account')}`,
        permanent: false,
      },
    };
  }
}
