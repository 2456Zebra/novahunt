import React from 'react';
import Link from 'next/link';
// ...other imports ...

export default function HeaderAuth({ user, onSignOut }) {
  return (
    <div className="header-auth">
      {/* ...other header UI... */}

      <div className="header-links">
        {/* Use Next Link for internal navigation to avoid build-time ESLint failure */}
        <Link href="/account/"><a>Account</a></Link>
        {' '}
        <Link href="/plans/"><a>Plans</a></Link>
      </div>

      {/* ...rest of component... */}
    </div>
  );
}
