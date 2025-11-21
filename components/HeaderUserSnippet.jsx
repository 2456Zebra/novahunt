import React from 'react';
import Link from 'next/link';

export default function HeaderUserSnippet({ user }) {
  return (
    <div className="header-user-snippet">
      <div className="user-name">{user?.name}</div>

      <div className="user-actions">
        <Link href="/account/"><a>Account</a></Link>
        {' '}
        <Link href="/upgrade/"><a>Upgrade</a></Link>
      </div>
    </div>
  );
}
