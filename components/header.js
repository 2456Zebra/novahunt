import { useEffect, useState } from 'react';
import Router from 'next/router';

export default function Header() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        if (typeof window === 'undefined') return;
        // supabase-js v2
        if (window.supabase?.auth?.getSession) {
          const { data } = await window.supabase.auth.getSession();
          if (mounted) setUser(data?.session?.user ?? null);
          window.supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) setUser(session?.user ?? null);
          });
        } else if (window.supabase?.auth?.user) {
          // v1 fallback
          setUser(window.supabase.auth.user());
          window.supabase.auth.onAuthStateChange((event, session) => {
            if (mounted) setUser(session ? session.user : null);
          });
        }
      } catch (err) {
        console.warn('Header init error', err);
      }
    }

    init();
    return () => { mounted = false; };
  }, []);

  function toggleMenu() {
    setMenuOpen(v => !v);
  }

  function signOut() {
    if (window.supabase?.auth?.signOut) {
      window.supabase.auth.signOut().then(() => {
        setUser(null);
        Router.push('/signin');
      });
    } else {
      Router.push('/signin');
    }
  }

  return (
    <header className="site-header">
      <div className="brand"><a href="/">YourBrand</a></div>

      <nav className="site-nav">
        {/* other links */}
      </nav>

      <div className="auth-area">
        {!user && <a href="/signin" className="btn">Sign in</a>}

        {user && (
          <div className={`account-wrapper ${menuOpen ? 'open' : 'closed'}`}>
            <button className="account-toggle" onClick={toggleMenu} aria-expanded={menuOpen}>
              <span className="account-name">{user?.email || user?.user_metadata?.display_name || 'Account'}</span>
            </button>

            <div className={`account-menu ${menuOpen ? 'visible' : 'hidden'}`}>
              <a href="/account">Account</a>
              <a href="/billing">Billing</a>
              <button onClick={signOut}>Sign out</button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
