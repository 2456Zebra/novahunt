import { useRouter } from 'next/router';
import Link from 'next/link';
import CheckoutSuccess from '../components/CheckoutSuccess';

/**
 * Simple /success page (client-side).
 * - Shows the new copy: "Thanks — your password has been registered."
 * - Does NOT perform any automatic redirect or countdown.
 * - Shows session_id from query for debugging (optional).
 */
export default function SuccessPage() {
  const router = useRouter();
  const { session_id } = router.query;

  const message = 'Thanks — your password has been registered.';

  return (
    <main style={{ maxWidth: 720, margin: '48px auto', padding: '0 16px', textAlign: 'center' }}>
      {/* Use the shared component if present, otherwise render inline */}
      {typeof CheckoutSuccess === 'function' ? (
        <CheckoutSuccess message={message} />
      ) : (
        <>
          <h1>{message}</h1>
          <p>If you'd like to sign in now, click the button below. This page will remain visible until you choose to navigate.</p>
          <div style={{ marginTop: 20 }}>
            <Link href="/signin" passHref>
              <a className="btn btn-primary" aria-label="Sign in">Sign in</a>
            </Link>
          </div>
        </>
      )}

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
