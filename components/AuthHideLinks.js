import { useEffect } from 'react';
import supabase from '../lib/supabaseClient';

export default function AuthHideLinks() {
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        if (!mounted) return;
        if (session) {
          const els = document.querySelectorAll('a[href="/signin"], a[href="/signup"]');
          els.forEach(el => {
            el.style.display = 'none';
          });
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  return null;
}
