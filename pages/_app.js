import { useEffect, useState, createContext, useContext } from 'react';
import '../styles/globals.css';
import Header from '../components/Header';
import GlobalRevealInterceptor from '../components/GlobalRevealInterceptor';

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

  // When authenticated, inject a small stylesheet to hide public "Sign in" / "Sign up" links
  useEffect(() => {
    const STYLE_ID = 'nova-hide-auth-links';
    const css = `
      a[href="/signin"], a[href="/signup"], a[href="/register"], .nav-signin, .nav-signup {
        display: none !important;
      }
    `;
    if (authenticated && typeof document !== 'undefined') {
      if (!document.getElementById(STYLE_ID)) {
        const s = document.createElement('style');
        s.id = STYLE_ID;
        s.appendChild(document.createTextNode(css));
        document.head.appendChild(s);
      }
    } else if (typeof document !== 'undefined') {
      const existing = document.getElementById(STYLE_ID);
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    }
    return () => {
      if (typeof document !== 'undefined') {
        const existing = document.getElementById(STYLE_ID);
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
      }
    };
  }, [authenticated]);

  const ctx = {
    loading,
    authenticated,
    user,
    refresh,
  };

  return (
    <AuthContext.Provider value={ctx}>
      {authenticated && <Header />}
      {/* Global interceptor handles legacy Reveal UI clicks on any page when signed in */}
      {typeof window !== 'undefined' && authenticated && <GlobalRevealInterceptor />}
      <Component {...pageProps} />
    </AuthContext.Provider>
  );
}
