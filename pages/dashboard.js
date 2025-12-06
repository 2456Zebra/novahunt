import Link from 'next/link';
import jwt from 'jsonwebtoken';

/**
 * Server-rendered Dashboard
 * - getServerSideProps reads the HttpOnly "auth" cookie, verifies the JWT, and passes user info to the page.
 * - If token is missing/invalid -> redirect to /signin (preserves redirect back).
 *
 * This ensures that when the browser requests /dashboard the server will detect the signed-in user
 * and render the proper header immediately (no client-side flash).
 *
 * Keep JWT_SECRET set in Vercel envs (JWT_SECRET or NEXTAUTH_SECRET).
 */
export default function DashboardPage({ user }) {
  // If you want more UI, expand below. This is a simple account header + placeholder content.
  return (
    <div style={{ minHeight: '100vh', fontFamily: '-apple-system, Roboto, sans-serif' }}>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', borderBottom: '1px solid #eee'
      }}>
        <div>
          <Link href="/"><a style={{ fontWeight: 700, fontSize: 18, color: '#111' }}>NovaHunt</a></Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, color: '#222' }}>{user?.email || 'Account'}</div>
            <div style={{ fontSize: 12, color: '#666' }}>Member</div>
          </div>

          <nav>
            <Link href="/account"><a style={{ marginRight: 12 }}>Account</a></Link>
            <Link href="/settings"><a style={{ marginRight: 12 }}>Settings</a></Link>
            <Link href="/api/logout"><a>Log out</a></Link>
          </nav>
        </div>
      </header>

      <main style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
        <h1 style={{ marginTop: 8 }}>Dashboard</h1>
        <p style={{ color: '#444' }}>Welcome{user?.email ? `, ${user.email}` : ''} — this is your dashboard.</p>

        <section style={{ marginTop: 24 }}>
          <h2>Account summary</h2>
          <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 6 }}>
            <strong>Email:</strong> {user?.email || '—'}<br />
            <strong>User ID:</strong> {user?.id || '—'}
          </div>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2>Next steps</h2>
          <ul>
            <li>Check your account settings.</li>
            <li>Start using NovaHunt features.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

export async function getServerSideProps({ req, res, resolvedUrl }) {
  const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret-change-me';

  // Read cookie (Next.js exposes cookies on req.cookies when using pages/)
  const token = (req.cookies && req.cookies.auth) || null;

  if (!token) {
    // Redirect to signin preserving original URL
    const redirectTo = `/signin?redirect=${encodeURIComponent(resolvedUrl || '/dashboard')}`;
    return {
      redirect: {
        destination: redirectTo,
        permanent: false,
      },
    };
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // payload should contain sub and email as set by /api/set-password
    const user = { id: payload.sub, email: payload.email || null };
    return {
      props: { user },
    };
  } catch (err) {
    // invalid token — clear cookie then redirect to signin
    res.setHeader('Set-Cookie', [
      'auth=deleted; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax'
    ].join('; '));
    const redirectTo = `/signin?redirect=${encodeURIComponent(resolvedUrl || '/dashboard')}`;
    return {
      redirect: {
        destination: redirectTo,
        permanent: false,
      },
    };
  }
}
