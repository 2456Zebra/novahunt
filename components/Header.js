import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../pages/_app';

/**
 * Header component
 * - If not authenticated: shows Sign in link.
 * - If authenticated: shows email, live usage counts and a dropdown with progress bars, Account and Sign out.
 *
 * Usage: import Header from '../components/Header' and include at top of pages.
 */
export default function Header() {
  const { loading: authLoading, authenticated, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ searches: 0, reveals: 0 });
  const [limits, setLimits] = useState({ searchesMax: 50, revealsMax: 25 });
  const [open, setOpen] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/usage', { credentials: 'same-origin' });
        const json = await res.json();
        if (!mounted.current) return;
        if (res.ok) {
          setCounts({ searches: json.searches || 0, reveals: json.reveals || 0 });
          setLimits({ searchesMax: json.searchesMax || 50, revealsMax: json.revealsMax || 25 });
        } else {
          setCounts({ searches: 0, reveals: 0 });
        }
      } catch (err) {
        console.error('Header load usage error', err);
      } finally {
        if (mounted.current) setLoading(false);
      }
    }

    if (!authLoading && authenticated) load();
    return () => { mounted.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, authenticated]);

  function percent(current, max) {
    if (!max || max <= 0) return 0;
    return Math.min(100, Math.round((current / max) * 100));
  }

  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, padding: '12px 20px', borderBottom: '1px solid #eee' }}>
      {/* Signed-out */}
      {!authLoading && !authenticated && (
        <div style={{ marginLeft: 'auto' }}>
          <Link href="/signin"><a style={{ textDecoration: 'none', color: '#111' }}>Sign in</a></Link>
        </div>
      )}

      {/* Signed-in header (no NovaHunt text on left per request) */}
      {!authLoading && authenticated && user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 13, color: '#222', textAlign: 'right' }}>
            <div style={{ fontWeight: 600 }}>{user.email}</div>
            <div style={{ fontSize: 12, color: '#666' }}>
              {counts.searches || 0} of {limits.searchesMax} searches &nbsp;·&nbsp; {counts.reveals || 0} of {limits.revealsMax} reveals
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <button
              aria-haspopup="true"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid #ddd',
                background: '#fff',
                cursor: 'pointer',
                fontSize: 13
              }}
            >
              Account ▾
            </button>

            {open && (
              <div style={{
                position: 'absolute',
                right: 0,
                marginTop: 8,
                width: 320,
                background: '#fff',
                border: '1px solid #e6e6e6',
                boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
                borderRadius: 8,
                padding: 12,
                zIndex: 100
              }}>
                <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Usage</div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontSize: 13 }}>Searches</div>
                    <div style={{ fontSize: 13 }}>{counts.searches || 0} / {limits.searchesMax}</div>
                  </div>
                  <div style={{ height: 10, background: '#f0f0f0', borderRadius: 6 }}>
                    <div style={{ height: '100%', width: `${percent(counts.searches||0, limits.searchesMax)}%`, background: '#0b74de', borderRadius: 6 }} />
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontSize: 13 }}>Reveals</div>
                    <div style={{ fontSize: 13 }}>{counts.reveals || 0} / {limits.revealsMax}</div>
                  </div>
                  <div style={{ height: 10, background: '#f0f0f0', borderRadius: 6 }}>
                    <div style={{ height: '100%', width: `${percent(counts.reveals||0, limits.revealsMax)}%`, background: '#12b76a', borderRadius: 6 }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <Link href="/account">
                    <a
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        textAlign: 'center',
                        borderRadius: 6,
                        background: '#12b76a',
                        color: '#fff',
                        textDecoration: 'none',
                        fontSize: 13,
                        display: 'inline-block'
                      }}
                    >
                      Account
                    </a>
                  </Link>

                  <a
                    href="/api/logout"
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      textAlign: 'center',
                      borderRadius: 6,
                      background: '#12b76a',
                      color: '#fff',
                      textDecoration: 'none',
                      fontSize: 13,
                      display: 'inline-block'
                    }}
                  >
                    Sign out
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
