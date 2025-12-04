// Minimal _app.js that initializes a Supabase client in the browser (no auth-helpers dependency).
import '../styles/globals.css';
import { useState, useEffect } from 'react';

function MyApp({ Component, pageProps }) {
  const [supabase, setSupabase] = useState(null);

  useEffect(() => {
    // Initialize only in the browser
    if (typeof window === 'undefined') return;
    if (supabase) return;

    try {
      const { createClient } = require('@supabase/supabase-js');
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (url && anon) {
        const client = createClient(url, anon);
        // Expose for debugging — remove in production
        // window.supabase is used by the troubleshooting snippets we ran earlier
        window.supabase = client;
        setSupabase(client);
      } else {
        console.warn('NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
      }
    } catch (e) {
      console.warn('Failed to initialize supabase client', e);
    }
  }, [supabase]);

  return <Component {...pageProps} supabase={supabase} />;
}

export default MyApp;
