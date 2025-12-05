import Link from 'next/link';

/**
 * PaymentSuccess component (replace old component that contained redirects/countdown)
 * - Uses the new copy and no auto-redirects.
 */
export default function PaymentSuccess({ message }) {
  return (
    <main className="payment-success" style={{ textAlign: 'center', maxWidth: 720, margin: '48px auto' }}>
      <h1>{message || 'Thanks — your password has been registered.'}</h1>

      <p>If you'd like to sign in now, click the button below. This page will remain visible until you choose to navigate.</p>

      <div style={{ marginTop: 20 }}>
        <Link href="/signin" passHref>
          <a className="btn btn-primary" aria-label="Sign in">Sign in</a>
        </Link>
      </div>

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
