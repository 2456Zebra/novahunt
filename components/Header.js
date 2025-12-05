// components/Header.js
// Client-side header that reads Supabase session, loads profile data, and renders the account pulldown.
// CSP-friendly: toggles visibility via classes, not inline styles.

import { useEffect, useState } from 'react';
import AccountMenu from './AccountMenu';
import Link from 'next/link';

export default function Header() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        if (typeof window === 'undefined') return;

        if (window.supabase?.auth?.getSession) {
          const { data } = await window.supabase.auth.getSession();
          const u = data?.session?.user ?? null;
          if (mounted) setUser(u);

          // subscribe to auth changes
          window.supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) setUser(session?.user ?? null);
          });
        } else if (window.supabase?.auth?.user) {
          const u = window.supabase.auth.user();
          if (mounted) setUser(u);
          window.supabase.auth.onAuthStateChange((_event, session) => {
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

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      try {
        if (!user || !window.supabase) return;
        const { data, error } = await window.supabase
          .from('profiles')
          .select('display_name,plan,search_count,search_limit,reveals_count,reveals_limit')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          if (mounted) {
            setProfile({
              display_name: data.display_name || user.email,
              plan: data.plan || null,
              search_count: data.search_count || 0,
              search_limit: data.search_limit || 0,
              reveals_count: data.reveals_count || 0,
              reveals_limit: data.reveals_limit || 0
            });
          }
          return;
        }

        const um = user?.user_metadata || {};
        if (mounted) {
          setProfile({
            display_name: um.display_name || user.email,
            plan: um.plan || null,
            search_count: um.search_count || 0,
            search_limit: um.search_limit || 0,
            reveals_count: um.reveals_count || 0,
            reveals_limit: um.reveals_limit || 0
          });
        }
      } catch (err) {
        console.warn('loadProfile error', err);
      }
    }
    loadProfile();
    return () => { mounted = false; };
  }, [user]);

  function computePercent(count = 0, limit = 0) {
    if (!limit || limit === 0) return 0;
    return Math.min(100, Math.round((count / limit) * 100));
  }

  return (
    <header className="site-header">
      <div className="brand">
        <Link href="/"><a>NovaHunt</a></Link>
      </div>

      <nav className="site-nav">
        <Link href="/plans"><a>Plans</a></Link>
        <Link href="/searches"><a>Searches</a></Link>
        <Link href="/reveals"><a>Reveals</a></Link>
      </nav>

      <div className="auth-area">
        {!user && <Link href="/signin"><a className="btn">Sign in</a></Link>}

        {user && (
          <div className="account-area">
            <div className="header-user">
              <div className="header-user-info">
                <div className="header-user-name">{profile?.display_name || user.email}</div>
                <div className="header-user-plan">{profile?.plan ? profile.plan : 'Free'}</div>
              </div>

              <div className="header-progress">
                <label className="progress-label">Searches</label>
                <progress value={computePercent(profile?.search_count, profile?.search_limit)} max="100"></progress>
                <small>{(profile?.search_count ?? 0)} / {(profile?.search_limit ?? '—')}</small>

                <label className="progress-label">Reveals</label>
                <progress value={computePercent(profile?.reveals_count, profile?.reveals_limit)} max="100"></progress>
                <small>{(profile?.reveals_count ?? 0)} / {(profile?.reveals_limit ?? '—')}</small>
              </div>

              <AccountMenu user={user} />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
