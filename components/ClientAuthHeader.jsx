import { useEffect, useState, useRef } from 'react';

export default function ClientAuthHeader() {
  const [email, setEmail] = useState('');
  const [usage, setUsage] = useState({ searches: 0, reveals: 0, limitSearches: 0, limitReveals: 0, plan: null });
  const [open, setOpen] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    function readFromLocalStorage() {
      try {
        const e = localStorage.getItem('nh_user_email') || '';
        const uRaw = localStorage.getItem('nh_usage');
        const u = uRaw ? JSON.parse(uRaw) : null;
        setEmail(e);
        if (u && typeof u === 'object') {
          setUsage({
            searches: u.searches || 0,
            reveals: u.reveals || 0,
            limitSearches: u.limitSearches || 0,
            limitReveals: u.limitReveals || 0,
            plan: u.plan || null,
          });
        }
      } catch (err) {
        // ignore parsing/localStorage errors
      }
    }

    readFromLocalStorage();
    mounted.current = true;

    function onStorage(e) {
      if (e.key === 'nh_user_email' || e.key === 'nh_usage') {
        readFromLocalStorage();
      }
    }
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
      mounted.current = false;
    };
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem('nh_user_email');
      localStorage.removeItem('nh_usage');
    } catch (e) {}
    window.location.href = '/signin';
  };

  const goToAccount = () => {
    window.location.href = '/account';
  };

  const usageLine = `${usage.searches || 0}/${usage.limitSearches || 0} searches • ${usage.reveals || 0}/${usage.limitReveals || 0} reveals`;

  if (!email) {
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <a href="/signin" style={{ color: '#0b74ff', textDecoration: 'none', fontWeight: 700 }}>Sign in</a>
        <a href="/signup" style={{ background: '#0b74ff', color: '#fff', padding: '8px 12px', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>Get started</a>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
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
        <div style={{ textAlign: 'right', lineHeight: 1 }}>
          <div style={{ fontSize: 13, color: '#111' }}>{email}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{usageLine}</div>
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
