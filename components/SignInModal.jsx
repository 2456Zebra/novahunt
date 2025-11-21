import React from 'react';
import Link from 'next/link';

export default function SignInModal({ onClose }) {
  return (
    <div className="signin-modal" role="dialog" aria-modal="true">
      <header><h2>Sign in</h2></header>

      <div className="signin-body">
        <p>
          Don’t have an account?{' '}
          <Link href="/signup/"><a>Sign up</a></Link>
        </p>

        <p>
          Learn about plans:{' '}
          <Link href="/plans/"><a>Plans</a></Link>
        </p>
      </div>

      <footer><button onClick={onClose}>Close</button></footer>
    </div>
  );
}
