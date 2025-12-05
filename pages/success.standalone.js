import { useRouter } from 'next/router';
import Link from 'next/link';

/**
 * Standalone /success page (no external component dependency).
 * Use this if your repo doesn't have components/CheckoutSuccess.
 */
export default function SuccessPageStandalone() {
  const router = useRouter();
  const { session_id } = router.query;

  return (
    <main style={{ maxWidth: 720, margin: '48px auto', padding: '0 16px', textAlign: 'center' }}>
      <h1>Thanks — your password has been registered.</h1>

      <p>If you'd like to sign in now, click the button below. This page will remain visible until you choose to navigate.</p>

      <div style={{ marginTop: 20 }}>
        <Link href="/signin" passHref>
          <a className="btn btn-primary" aria-label="Sign in">Sign in</a>
        </Link>
      </div>

      {session_id && (
        <p style={{ marginTop: 24, color: '#666', fontSize: 13 }}>
          session_id: <code>{session_id}</code>
        </p>
      )}

      <style jsx>{`
        .btn {
          display: inline-block;
          padding: 10px 16px;
          background: #111;
          color: #fff;
          border-radius: 6px;
          text-decoration: none;
        }
      `}</style>
    </main>
  );
}
