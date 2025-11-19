'use client';

import { useEffect, useState } from 'react';
import { signOut, getLocalSession } from '../utils/auth';

export default function HeaderAuth() {
  const [session, setSession] = useState(getLocalSession());

  useEffect(() => {
    function update() {
      setSession(getLocalSession());
    }
    window.addEventListener('account-usage-updated', update);
    return () => window.removeEventListener('account-usage-updated', update);
  }, []);

  if (!session) {
    return <button onClick={() => window.location.href = '/signin'} className="btn">Sign In</button>;
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div>{session.email}</div>
      <button onClick={() => signOut()} className="btn">Sign out</button>
    </div>
  );
}