import React from 'react';
import Link from 'next/link';
import HeaderUserSnippet from './HeaderUserSnippet';

export default function HeaderAuth({ user, onSignOut }) {
  // If user present, show the UserSnippet (Account/Upgrade handled there).
  // If not, show Sign in and Sign up (Sign up routes to Plans).
  if (user && user.sub) {
    return <HeaderUserSnippet user={user} />;
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('open-signin-modal', { detail: { prefillEmail: '' } }))}
        style={{ background: 'transparent', border: '1px solid #e5e7eb', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}
      >
        Sign in
      </button>

      {/* Upper-right Sign up routes to Plans page */}
      <Link href="/plans/">
        <a style={{ padding: '6px 10px', borderRadius: 6, background: '#111827', color: '#fff', textDecoration: 'none' }}>Sign up</a>
      </Link>
    </div>
  );
}
