import Link from 'next/link';
import PropTypes from 'prop-types';

/**
 * Generic checkout / password-success display component.
 * - Uses the new copy: "Thanks — your password has been registered."
 * - Does NOT perform any automatic redirect or countdown.
 * - Provides an explicit Sign in button/link.
 */
export default function CheckoutSuccess({ message }) {
  return (
    <main className="checkout-success">
      <h1>{message || 'Thanks — your password has been registered.'}</h1>

      <p>
        If you'd like to sign in now, click the button below. This page will remain visible until you choose to navigate.
      </p>

      <div style={{ marginTop: 20 }}>
        <Link href="/signin" passHref>
          <a className="btn btn-primary" aria-label="Sign in">
            Sign in
          </a>
        </Link>
      </div>

      <style jsx>{`
        .checkout-success {
          max-width: 720px;
          margin: 48px auto;
          padding: 0 16px;
          text-align: center;
        }
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

CheckoutSuccess.propTypes = {
  message: PropTypes.string,
};
