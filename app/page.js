'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Force refresh header
        window.location.reload();
      }
    });
  }, []);

  return (
    <div style={{ padding: '80px 20px', textAlign: 'center', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 48 }}>Welcome back!</h1>
      <p style={{ fontSize: 24, marginTop: 20 }}>You are now signed in.</p>
      <p>Your header and pulldown should be visible above.</p>
    </div>
  );
}
