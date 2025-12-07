import { useEffect, useState, createContext, useContext } from 'react';
import '../styles/globals.css';
import Header from '../components/Header';

// Auth context
const AuthContext = createContext({
  loading: true,
  authenticated: false,
  user: null,
  refresh: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

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

export default function MyApp({ Component, pageProps }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  async function refresh() {
    setLoading(true);
    const info = await fetchAuth();
    setAuthenticated(info.authenticated);
    setUser(info.user);
    setLoading(false);
    return info;
  }

  useEffect(() => {
    refresh().catch((e) => {
      console.error('Initial auth fetch failed', e);
      setLoading(false);
      setAuthenticated(false);
      setUser(null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ctx = {
    loading,
    authenticated,
    user,
    refresh,
  };

  // Render Header only when the user is authenticated.
  // This ensures the homepage (and other public pages) do not show the header until sign-in.
  return (
    <AuthContext.Provider value={ctx}>
      {authenticated && <Header />}
      <Component {...pageProps} />
    </AuthContext.Provider>
  );
}
