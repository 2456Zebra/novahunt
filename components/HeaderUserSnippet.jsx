'use client';

import React from 'react';
import AccountPopover from './AccountPopover';

export default function HeaderUserSnippet() {
  // read nh_session from localStorage and parse email if present
  let email = '';
  try {
    const s = typeof window !== 'undefined' ? localStorage.getItem('nh_session') : null;
    if (s) {
      const parsed = JSON.parse(s);
      email = parsed?.email || '';
    }
  } catch (e) {
    email = '';
  }

  if (!email) {
    return (
      <div>
        <a href="/signin" style={{ color: '#2563eb' }}>Sign in</a>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <AccountPopover email={email} />
    </div>
  );
}
