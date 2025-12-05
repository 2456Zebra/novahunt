// pages/_app.js
import '../styles/globals.css';
import '../styles/header.css';
import '../styles/password-success.css';
import '../styles/set-password.css'; // global CSS must be here
import { useState, useEffect } from 'react';

function MyApp({ Component, pageProps }) {
  const [supabase, setSupabase] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (supabase) return;

    try {
      const { createClient } = require('@supabase/supabase-js');
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (url && anon) {
        const client = createClient(url, anon);
        window.supabase = client;
        setSupabase(client);
      } else {
        console.warn('NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing');
      }
    } catch (e) {
      console.warn('Failed to initialize supabase client', e);
    }
  }, [supabase]);

  return <Component {...pageProps} supabase={supabase} />;
}

export default MyApp;
