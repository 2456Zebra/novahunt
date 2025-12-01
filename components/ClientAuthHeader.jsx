import { useEffect, useState, useRef } from 'react';

/*
ClientAuthHeader
- Detects signed-in user via localStorage (nh_user_email, nh_usage) OR server cookie nh_session
- Hides legacy Sign in / Sign up links automatically (covers common hrefs)
- Renders email + usage button with dropdown (Account / Logout)
- Render this in your header where Sign in / Sign up currently live (or only on the homepage)
*/
export default function ClientAuthHeader() {
  const [email, setEmail] = useState('');
  const [usage, setUsage] = useState({ searches: 0, reveals: 0, limitSearches: 0, limitReveals: 0, plan: null });
  const [open, setOpen] = useState(false);
  const mounted = useRef(false);

  function readFromLocal() {
    try {
      const lsEmail = localStorage.getItem('nh_user_email') || '';
      const lsUsageRaw = localStorage.getItem('nh_usage');
      const lsUsage = lsUsageRaw ? JSON.parse(lsUsageRaw) : null;

      if (lsEmail) setEmail(lsEmail);
      if (lsUsage && typeof lsUsage === 'object') {
        setUsage({
          searches: lsUsage.searches || 0,
          reveals: lsUsage.reveals || 0,
          limitSearches: lsUsage.limitSearches || 0,
          limitReveals: lsUsage.limitReveals || 0,
          plan: lsUsage.plan || null,
        });
      }

      // If no localStorage email, attempt to read server-set nh_session cookie (URL-encoded JSON)
      if (!lsEmail && typeof document !== 'undefined') {
        const cookies = document.cookie.split(';').map((c) => c.trim());
        const nh = cookies.find((c) => c.startsWith('nh_session='));
        if (nh) {
          try {
            const payload = JSON.parse(decodeURIComponent(nh.split('=')[1]));
            if (payload && payload.email) setEmail(payload.email);
            if (payload && (payload.limitSearches || payload.limitReveals)) {
              setUsage((u) => ({
                ...u,
                limitSearches: payload.limitSearches || u.limitSearches,
                limitReveals: payload.limitReveals || u.limitReveals,
                plan: payload.plan || u.plan,
              }));
            }
          } catch (e) {
            // ignore cookie parse errors
          }
        }
      }
    } catch (err) {
      // ignore localStorage parse errors
    }
  }

  useEffect(() => {
    mounted.current = true;
    readFromLocal();

    function onStorage(e) {
      if (e.key === 'nh_user_email' || e.key === 'nh_usage' || e.key === 'nh_usage_last_update') {
        readFromLocal();
      }
    }
    window.addEventListener('storage', onStorage);

    return () => {
      mounted.current = false;
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Hide legacy Sign in / Sign up links and optional logo when signed in.
  useEffect(() => {
    if (!email) return;
    try {
      const selectors = [
        'a[href="/signin"]',
        'a[href="/signup"]',
        'a[href="/login"]',
        'a[href="/register"]',
        'a[data-role="signin"]',
        'a[data-role="signup"]'
      ];
      selectors.forEach((sel) => {
        const el = document.querySelector(sel);
        if (el) el.style.display = 'none';
      });

      // Optional: hide site logo if it has id="site-logo" (add id to your logo if desired)
      const logo = document.querySelector('#site-logo');
      if (logo) logo.style.display = 'none';
    } catch (e) {
      // ignore DOM manipulation errors
    }
  }, [email]);

  const handleLogout = () => {
    try {
      localStorage.removeItem('nh_user_email');
      localStorage.removeItem('nh_usage');
      localStorage.removeItem('nh_usage_last_update');
      // Try to clear server cookie (best-effort)
      document.cookie = 'nh_session=; Path=/; Max-Age=0; SameSite=Lax';
    } catch (e) {}
    window.location.href = '/signin';
  };

  const goToAccount = () => {
    window.location.href = '/account';
  };

  if (!email) return null; // render nothing so your original links remain

  const usageLine = `${usage.searches || 0}/${usage.limitSearches || 0} searches • ${usage.reveals || 0}/${usage.limitReveals || 0} reveals`;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          padding: '6px 10px',
          borderRadius: 999,
          border: '1px solid #e6e6e6',
          background: '#fff',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 13
        }}
      >
        <div style={{ textAlign: 'right', lineHeight: 1 }}>
          <div style={{ color: '#111' }}>{email}</div>
          <div style={{ color: '#666', fontSize: 12 }}>{usageLine}</div>
        </div>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            right: 0,
            marginTop: 8,
            width: 260,
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: 8,
            boxShadow: '0 12px 32px rgba(12,18,26,0.08)',
            padding: 12,
            zIndex: 50,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{email}</div>
          <div style={{ color: '#666', fontSize: 13, marginBottom: 10 }}>{usageLine}</div>

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
  );
}
