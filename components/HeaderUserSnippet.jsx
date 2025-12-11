import React from 'react';
import Link from 'next/link';

/**
 * HeaderUserSnippet: shows Account / Upgrade for signed-in users.
 * Keep this focused on user actions (so the main nav does not duplicate).
 */
export default function HeaderUserSnippet({ user }) {
  return (
    <div className="header-user-snippet" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ marginRight: 8 }}>{user?.name || user?.email || 'User'}</div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Link href="/account/">
          <a style={{ color: '#374151', textDecoration: 'none' }}>Account</a>
        </Link>

        <Link href="/upgrade/">
          <a style={{ padding: '6px 10px', background: '#111827', color: '#fff', borderRadius: 6, textDecoration: 'none' }}>Upgrade</a>
        </Link>
      </div>
    </div>
  );
}
