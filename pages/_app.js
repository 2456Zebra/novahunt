// pages/_app.js
// Global CSS must be imported here (Next.js rule). This file also initializes the Supabase client.
// Added: an app-level defensive guard that intercepts client-side navigations to "/signin"
// as early as possible. This helps keep the user on password-success while session persistence finishes.
//
// IMPORTANT: This is a temporary debugging/workaround measure. Remove or refine after you fix
// the underlying redirect logic (server-side guards, or client-side auth checks that redirect).

import '../styles/globals.css';
import '../styles/header.css';
import '../styles/password-success.css';
import '../styles/set-password.css';
import { useState, useEffect } from 'react';
import React from 'react';

// Module-scope, early-run defensive guard (executes on client when this module loads).
if (typeof window !== 'undefined') {
  try {
    // Try patching next/router's push/replace if available early
    try {
      // require('next/router') is available on client bundles
      const nextRouter = require('next/router');
      const origPush = nextRouter.push?.bind(nextRouter);
      const origReplace = nextRouter.replace?.bind(nextRouter);

      const blockIfSignin = (u) => {
        try {
          const s = typeof u === 'string' ? u : (u?.pathname || u?.toString?.() || '');
          if (String(s).includes('/signin')) {
            console.warn('[_app guard] blocked Router navigation to', s);
            console.warn(new Error().stack);
            return true;
          }
        } catch (err) {}
        return false;
      };

      if (origPush) {
        nextRouter.push = (...args) => {
          if (blockIfSignin(args[0])) return Promise.resolve(false);
          return origPush(...args);
        };
      }
      if (origReplace) {
        nextRouter.replace = (...args) => {
          if (blockIfSignin(args[0])) return Promise.resolve(false);
          return origReplace(...args);
        };
      }
    } catch (err) {
      // ignore if next/router not ready
    }

    // Patch window.location.assign/replace and history.pushState
    const origAssign = window.location.assign.bind(window.location);
    const origReplaceLoc = window.location.replace.bind(window.location);
    const origPushState = window.history.pushState.bind(window.history);
    window.location.assign = (url) => {
      try {
        if (typeof url === 'string' && url.includes('/signin')) {
          console.warn('[_app guard] blocked location.assign to', url);
          console.warn(new Error().stack);
          return;
        }
      } catch (err) {}
      return origAssign(url);
    };
    window.location.replace = (url) => {
      try {
        if (typeof url === 'string' && url.includes('/signin')) {
          console.warn('[_app guard] blocked location.replace to', url);
          console.warn(new Error().stack);
          return;
        }
      } catch (err) {}
      return origReplaceLoc(url);
    };
    window.history.pushState = (...args) => {
      try {
        const url = args[2];
        if (typeof url === 'string' && url.includes('/signin')) {
          console.warn('[_app guard] blocked history.pushState to', url);
          console.warn(new Error().stack);
          return;
        }
      } catch (err) {}
      return origPushState(...args);
    };
  } catch (err) {
    // don't break app if guard fails
    // console.warn('app-level guard init failed', err);
  }
}

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
        // Expose for debugging — you can remove this line once flow is stable
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
