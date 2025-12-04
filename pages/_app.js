import '../styles/globals.css';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'; // or from '@supabase/supabase-js' depending on your setup
import { useState } from 'react';

function MyApp({ Component, pageProps }) {
  // initialize client once per session in the browser
  const [supabase] = useState(() => {
    // adapt to the way you create your client. Example for supabase-js v2:
    // import { createClient } from '@supabase/supabase-js'
    // return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    try {
      /* eslint-disable no-undef */
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (typeof window !== 'undefined' && url && anon) {
        const { createClient } = require('@supabase/supabase-js');
        const client = createClient(url, anon);
        // expose for debugging (remove in production)
        window.supabase = client;
        return client;
      }
    } catch (e) {
      console.warn('supabase init failed', e);
    }
    return null;
  });

  return <Component {...pageProps} supabase={supabase} />;
}

export default MyApp;
