import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function HeaderAuth() {
  const { data: session, status } = useSession();
  const loading = status === 'loading';

  function handleSignOut() {
    signOut({ callbackUrl: '/' });
  }

  if (loading) {
    return <div className="header-auth">Loading...</div>;
  }

  return (
    <div className="header-auth">
      {session ? (
        <div className="signed-in">
          <span className="email">{session.user?.email || 'User'}</span>
          <button onClick={handleSignOut} className="btn btn-link">Sign out</button>
        </div>
      ) : (
        <div className="signed-out">
          <Link href="/signup"><a className="btn">Create account</a></Link>
          <Link href="/signin"><a className="btn btn-primary">Sign in</a></Link>
        </div>
      )}
    </div>
  );
}
