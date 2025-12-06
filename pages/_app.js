import { useEffect, useState, createContext, useContext } from 'react';
import Router from 'next/router';
import '../styles/globals.css'; // adjust if your project uses different path

// Auth context to share auth state across the app
const AuthContext = createContext({
  loading: true,
  authenticated: false,
  user: null,
  refresh: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Small helper to fetch /api/me and return auth state
 */
async function fetchAuth() {
  try {
    const res = await fetch('/api/me', { credentials: 'same-origin' });
    if (!res.ok) return { authenticated: false, user: null };
    const json = await res.json();
    return { authenticated: !!json?.authenticated, user: json?.user || null };
  } catch (err) {
    console.error('fetchAuth error', err);
    return { authenticated: false, user: null };
  }
}

/**
 * App wrapper
 * - On load, queries /api/me to determine auth state.
 * - Exposes loading state so pages/components don't redirect until we know.
 * - If a page sets `Component.authRequired = true`, we will redirect to /signin
 *   only after we know auth === false (prevents flash).
 */
export default function MyApp({ Component, pageProps }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Refresh auth state helper
  async function refresh() {
    setLoading(true);
    const info = await fetchAuth();
    setAuthenticated(info.authenticated);
    setUser(info.user);
    setLoading(false);
    return info;
  }

  useEffect(() => {
    // On initial mount, fetch auth info
    refresh().catch((e) => {
      console.error('Initial auth fetch failed', e);
      setLoading(false);
      setAuthenticated(false);
      setUser(null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Client-side guard for pages that opt-in to require auth.
  // Pages can set `PageComponent.authRequired = true` (static property).
  useEffect(() => {
    // If component doesn't require auth, nothing to do.
    if (!Component?.authRequired) return;

    // If still loading, do not redirect yet — this prevents flashes.
    if (loading) return;

    // If not authenticated, redirect to signin (preserving redirect back)
    if (!authenticated) {
      const redirectTo = Router.asPath || '/';
      Router.replace(`/signin?redirect=${encodeURIComponent(redirectTo)}`);
    }
  }, [Component, loading, authenticated]);

  const ctx = {
    loading,
    authenticated,
    user,
    refresh,
  };

  // If a page wants to show a loading indicator while auth is unknown,
  // that page can check useAuth().loading.
  return (
    <AuthContext.Provider value={ctx}>
      <Component {...pageProps} />
    </AuthContext.Provider>
  );
}
