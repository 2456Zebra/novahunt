import jwt from 'jsonwebtoken';
import Link from 'next/link';

/**
 * Account page (server rendered)
 * - No Header import here: Header is rendered by pages/_app when authenticated
 * - Shows account info and "Go to homepage" button
 */
export default function AccountPage({ user }) {
  return (
    <main style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1>Account</h1>
      <p>Signed in as <strong>{user?.email}</strong></p>

      <section style={{ marginTop: 18 }}>
        <p style={{ marginBottom: 12 }}>
          Go to homepage and start searching for company emails powered by NovaHunt AI
        </p>
        <div>
          <Link href="/">
            <a style={{ display: 'inline-block', padding: '10px 14px', background: '#0b74de', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
              Go to homepage
            </a>
          </Link>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
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
