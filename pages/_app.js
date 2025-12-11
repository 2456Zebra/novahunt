import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/router';

// Client-side Supabase (requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function AppPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const { data } = await supabase.auth.getSession();
        const s = data?.session || null;
        if (!mounted) return;
        setSession(s);
        setUser(s?.user || null);
        setLoading(false);
      } catch (err) {
        console.error('supabase getSession error', err);
        setLoading(false);
      }
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/'); // or /sign-in
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading…</div>;
  }

  if (!user) {
    return (
      <div style={{ maxWidth: 680, margin: '48px auto', padding: 20 }}>
        <h1>Welcome</h1>
        <p>You are not signed in. Please sign in or complete the signup flow.</p>
        <div style={{ marginTop: 12 }}>
          <a href="/sign-in">Sign in</a> · <a href="/plans" style={{ marginLeft: 8 }}>Choose a plan</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 980, margin: '48px auto', padding: 20 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Account</h2>
        <div>
          <strong>{user.email}</strong>
          <button onClick={handleSignOut} style={{ marginLeft: 12, padding: '6px 10px' }}>
            Sign out
          </button>
        </div>
      </header>

      <main style={{ marginTop: 24 }}>
        <section>
          <h3>Summary</h3>
          <p>Welcome — this is your app landing page. Replace with dashboard UI.</p>
        </section>

        <section style={{ marginTop: 18 }}>
          <h3>Usage</h3>
          <p>Show searches/reveals usage here (hook into your usage API / database).</p>
        </section>
      </main>
    </div>
  );
}
