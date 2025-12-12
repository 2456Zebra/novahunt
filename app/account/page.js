'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function Account() {
  const [user, setUser] = useState(null);
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  return (
    <div style={{ padding: 60, textAlign: 'center', fontFamily: 'system-ui', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 42 }}>Account</h1>
      {user ? (
        <div style={{ background: '#f0f8ff', padding: 30, borderRadius: 16, margin: '40px 0' }}>
          <p style={{ fontSize: 20 }}>Signed in as</p>
          <p style={{ fontSize: 28, fontWeight: 'bold' }}>{user.email}</p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
        <a href="/" style={{ padding: 16, background: '#0066ff', color: 'white', borderRadius: 8, textDecoration: 'none' }}>Back to Homepage</a>
        <button onClick={() => supabase.auth.signOut()} style={{ padding: 16, background: '#333', color: 'white', borderRadius: 8 }}>Sign Out</button>
      </div>
    </div>
  );
}
