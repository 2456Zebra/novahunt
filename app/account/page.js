'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function Account() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      } else {
        // Force refresh if no session (fixes the "Not signed in" bug)
        const { data } = await supabase.auth.refreshSession();
        if (data.session) {
          setUser(data.session.user);
        }
      }
      setLoading(false);
    };
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) return <p>Loading...</p>;

  if (!user) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <h1>Account</h1>
        <p>Not signed in</p>
        <a href="/">Back to Homepage</a>
      </div>
    );
  }

  return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      <h1>Account</h1>
      <p>Signed in as <strong>{user.email}</strong></p>
      <p>Saved Reveals</p>
      <p>No saved contacts found.</p>
      <div>
        <button onClick={() => router.push('/pricing')}>Change plan</button>
        <button onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
      <p><a href="/">Back to Homepage</a></p>
    </div>
  );
}
