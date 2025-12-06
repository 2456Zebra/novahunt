import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import CheckoutSuccess from '../components/CheckoutSuccess';

/**
 * /success page
 * - Reads ?session_id= from the URL (Stripe Checkout redirect)
 * - Calls /api/session-info?session_id=... to determine whether the customer already has a password
 * - If hasPassword === true => show "Thanks — your password has been registered." + Sign in button
 * - Otherwise => show "Payment successful. Set a password to sign in and access your account." + Set password button
 *
 * Note: /api/session-info must be implemented server-side to securely check Stripe + your user DB.
 */
export default function SuccessPage() {
  const router = useRouter();
  const { session_id } = router.query;

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!session_id) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/session-info?session_id=${encodeURIComponent(session_id)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!mounted) return;
        setInfo(json);
      })
      .catch((err) => {
        console.error('session-info fetch error', err);
        if (mounted) setError('Unable to verify session. Please try again or contact support.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [session_id]);

  if (!session_id) {
    return (
      <main style={{ maxWidth: 720, margin: '48px auto', padding: '0 16px', textAlign: 'center' }}>
        <h1>Payment processed</h1>
        <p>We did not receive a session id. If you were redirected from Stripe, try again or contact support.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main style={{ maxWidth: 720, margin: '48px auto', padding: '0 16px', textAlign: 'center' }}>
        <h1>Processing…</h1>
        <p>Verifying your payment details. This will only take a moment.</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ maxWidth: 720, margin: '48px auto', padding: '0 16px', textAlign: 'center' }}>
        <h1>Payment processed</h1>
        <p style={{ color: 'red' }}>{error}</p>
        <p>You can try signing in or contact support if you need help.</p>
        <div style={{ marginTop: 20 }}>
          <Link href="/signin" passHref><a className="btn">Sign in</a></Link>
        </div>
      </main>
    );
  }

  const { hasPassword = false, email, setPasswordToken } = info || {};

  if (hasPassword) {
    return (
      <main style={{ maxWidth: 720, margin: '48px auto', padding: '0 16px', textAlign: 'center' }}>
        <h1>Thanks — your password has been registered.</h1>
        <p>If you'd like to sign in now, click the button below.</p>

        <div style={{ marginTop: 20 }}>
          <Link href="/signin" passHref>
            <a className="btn">Sign in</a>
          </Link>
        </div>

        {email && (
          <p style={{ marginTop: 24, color: '#666', fontSize: 13 }}>
            Account email: <code>{email}</code>
          </p>
        )}
      </main>
    );
  }

  const setPasswordHref = setPasswordToken
    ? `/set-password?token=${encodeURIComponent(setPasswordToken)}`
    : `/set-password?session_id=${encodeURIComponent(session_id)}`;

  return (
    <main style={{ maxWidth: 720, margin: '48px auto', padding: '0 16px', textAlign: 'center' }}>
      <h1>Payment successful</h1>

      <p>Set a password to sign in and access your account.</p>

      <div style={{ marginTop: 20 }}>
        <Link href={setPasswordHref} passHref>
          <a className="btn">Set password</a>
        </Link>
      </div>

      {email && (
        <p style={{ marginTop: 24, color: '#666', fontSize: 13 }}>
          Account email: <code>{email}</code>
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
