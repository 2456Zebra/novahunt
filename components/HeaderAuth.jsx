import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

// Replace or import this component in your header layout.
// Behavior: hide "Sign In" link when a local nh_session exists (localStorage or cookie).
export default function HeaderAuth() {
  const [session, setSession] = useState(null);
  const router = useRouter();

  useEffect(() => {
    function readSession() {
      // Try localStorage first (client session)
      try {
        const ls = localStorage.getItem('nh_session');
        if (ls) {
          try {
            const parsed = JSON.parse(ls);
            setSession(parsed);
            return;
          } catch (_) {
            setSession(ls);
            return;
          }
        }
      } catch (e) {
        // ignore
      }
      // fallback: try cookie
      try {
        const match = document.cookie.match(/(?:^|; )nh_session=([^;]+)/);
        if (match) {
          try {
            const parsed = JSON.parse(decodeURIComponent(match[1]));
            setSession(parsed);
            return;
          } catch (_) {
            setSession(decodeURIComponent(match[1]));
            return;
          }
        }
      } catch (e) {
        // ignore
      }
      setSession(null);
    }

    readSession();

    // Update when a 'account-usage-updated' event is fired
    function onUpdate() {
      readSession();
    }
    window.addEventListener('account-usage-updated', onUpdate);
    return () => window.removeEventListener('account-usage-updated', onUpdate);
  }, []);

  function signOut() {
    try {
      localStorage.removeItem('nh_session');
      document.cookie = 'nh_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    } catch (e) { /* ignore */ }
    // Optionally hit signout API if you have one, then reload
    router.reload();
  }

  return (
    <div className="header-auth">
      {session ? (
        <div className="signed-in">
          <span className="email">{typeof session === 'object' ? session.email : String(session)}</span>
          <button onClick={signOut} className="btn btn-link">Sign out</button>
        </div>
      ) : (
        <div className="signed-out">
          <Link href="/signup"><a className="btn">Create account</a></Link>
          <Link href="/signin"><a className="btn btn-primary">Sign in</a></Link>
        </div>
      )}
    </div>
  );
}
