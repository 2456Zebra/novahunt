import { useEffect, useState } from 'react';

/*
  Enhanced Dashboard placeholder

  - Shows signed-in user email (reads from query ?email= or localStorage 'nh_user_email' as fallback)
  - Top-right lightweight user area with a dropdown showing Searches / Reveals usage
  - Account and Logout buttons (Logout clears localStorage email and redirects to /signin)
  - Main area has quick actions and a compact usage summary
  - This is intentionally client-side and not tied to any auth provider.
    When you wire real auth, replace the user/email fetching and logout behavior.
*/

function getQueryParam(name) {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

export default function DashboardPage() {
  const [email, setEmail] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [usage, setUsage] = useState({ searches: 0, reveals: 0, limitSearches: 0, limitReveals: 0 });

  useEffect(() => {
    // Try query param first (useful immediately after successful checkout redirect)
    const qEmail = getQueryParam('email');
    if (qEmail) {
      setEmail(qEmail);
      try { localStorage.setItem('nh_user_email', qEmail); } catch (e) {}
    } else {
      // fallback to localStorage if available (you can set this after signin)
      try {
        const stored = localStorage.getItem('nh_user_email') || '';
        setEmail(stored);
      } catch (e) {
        setEmail('');
      }
    }

    // In the real app you'd fetch usage for the current user from your API.
    // We'll use a small heuristic: if a query ?searches= & reveals= exist, use them; otherwise sample values
    const qSearches = parseInt(getQueryParam('searches') || '', 10);
    const qReveals = parseInt(getQueryParam('reveals') || '', 10);
    if (!Number.isNaN(qSearches) || !Number.isNaN(qReveals)) {
      setUsage({
        searches: Number.isNaN(qSearches) ? 0 : qSearches,
        reveals: Number.isNaN(qReveals) ? 0 : qReveals,
        limitSearches: 3000,
        limitReveals: 1500,
      });
    } else {
      // Example demo values
      setUsage({ searches: 120, reveals: 48, limitSearches: 3000, limitReveals: 1500 });
    }
  }, []);

  function handleLogout() {
    try {
      localStorage.removeItem('nh_user_email');
    } catch (e) {}
    // redirect to sign in (or homepage)
    window.location.href = '/signin';
  }

  function goToAccount() {
    window.location.href = '/account';
  }

  function toggleDropdown() {
    setDropdownOpen((v) => !v);
  }

  return (
    <main style={{ padding: 24, fontFamily: 'Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Dashboard</h1>
          <p style={{ margin: '6px 0 0 0', color: '#666' }}>
            Welcome back {email ? <strong>{email}</strong> : '—'}.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={toggleDropdown}
              aria-expanded={dropdownOpen}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: 999,
                border: '1px solid #e6e6e6',
                background: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#666' }}>Usage</div>
                <div style={{ fontSize: 13, color: '#111' }}>
                  {usage.searches}/{usage.limitSearches} searches
                </div>
              </div>
            </button>

            {dropdownOpen && (
              <div
                role="menu"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: 260,
                  background: '#fff',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: 8,
                  boxShadow: '0 12px 32px rgba(12,18,26,0.08)',
                  padding: 12,
                  zIndex: 50,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Usage summary</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ color: '#666' }}>Searches</div>
                  <div style={{ fontWeight: 700 }}>{usage.searches} / {usage.limitSearches}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ color: '#666' }}>Reveals</div>
                  <div style={{ fontWeight: 700 }}>{usage.reveals} / {usage.limitReveals}</div>
                </div>

                <div style={{ height: 1, background: '#f3f3f3', margin: '12px 0' }} />

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={goToAccount}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid #e6e6e6',
                      background: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    Account
                  </button>
                  <button
                    onClick={handleLogout}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#ff4d4f',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>

          <a
            href="/plans"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              textDecoration: 'none',
              border: '1px solid #e6e6e6',
              color: '#333',
              background: '#fff',
              fontWeight: 600,
            }}
          >
            View plans
          </a>
        </div>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div style={{ padding: 18, borderRadius: 10, border: '1px solid #eee', background: '#fff' }}>
          <h2 style={{ marginTop: 0 }}>Quick actions</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a
              href="/search"
              style={{
                display: 'inline-block',
                padding: '10px 14px',
                borderRadius: 8,
                background: '#0b74ff',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 700,
              }}
            >
              New search
            </a>

            <a
              href="/reveals"
              style={{
                display: 'inline-block',
                padding: '10px 14px',
                borderRadius: 8,
                background: '#fff',
                border: '1px solid #e6e6e6',
                color: '#333',
                textDecoration: 'none',
                fontWeight: 700,
              }}
            >
              View reveals
            </a>

            <a
              href="/csv"
              style={{
                display: 'inline-block',
                padding: '10px 14px',
                borderRadius: 8,
                background: '#fff',
                border: '1px solid #e6e6e6',
                color: '#333',
                textDecoration: 'none',
                fontWeight: 700,
              }}
            >
              Export CSV
            </a>
          </div>

          <div style={{ marginTop: 18 }}>
            <h3 style={{ marginBottom: 8 }}>Recent activity</h3>
            <ul style={{ marginTop: 0 }}>
              <li>Signup completed — {email || 'user@example.com'}</li>
              <li>Checkout session completed — {new Date().toLocaleString()}</li>
              <li>Usage snapshot: {usage.searches} searches used</li>
            </ul>
          </div>
        </div>

        <aside style={{ padding: 18, borderRadius: 10, border: '1px solid #eee', background: '#fff' }}>
          <h3 style={{ marginTop: 0 }}>Account summary</h3>
          <div style={{ marginTop: 8 }}>
            <div style={{ color: '#666', fontSize: 13 }}>Plan</div>
            <div style={{ fontWeight: 800, marginTop: 6 }}>NovaHunt Pro</div>
            <div style={{ color: '#666', marginTop: 8 }}>
              Next billing: in 29 days
            </div>
          </div>

          <div style={{ height: 12 }} />

          <div>
            <div style={{ color: '#666', fontSize: 13 }}>Usage</div>
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{usage.searches} / {usage.limitSearches} searches</div>
              <div style={{ height: 8 }} />
              <div style={{ background: '#f3f4f6', height: 8, borderRadius: 8, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, Math.round((usage.searches / Math.max(1, usage.limitSearches)) * 100))}%`,
                    height: '100%',
                    background: '#0b74ff',
                  }}
                />
              </div>

              <div style={{ height: 10 }} />

              <div style={{ fontSize: 13, fontWeight: 700 }}>{usage.reveals} / {usage.limitReveals} reveals</div>
              <div style={{ height: 8 }} />
              <div style={{ background: '#f3f4f6', height: 8, borderRadius: 8, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, Math.round((usage.reveals / Math.max(1, usage.limitReveals)) * 100))}%`,
                    height: '100%',
                    background: '#22c55e',
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ height: 12 }} />

          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href="/account"
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid #e6e6e6',
                background: '#fff',
                color: '#333',
                textDecoration: 'none',
                fontWeight: 700,
                flex: 1,
                textAlign: 'center',
              }}
            >
              Manage account
            </a>

            <button
              onClick={handleLogout}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                background: '#ff4d4f',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
                flex: 1,
              }}
            >
              Logout
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}
