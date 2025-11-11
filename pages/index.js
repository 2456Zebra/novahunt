import { useState, useEffect } from 'react';

export default function Home() {
  const [domain, setDomain] = useState('');
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (user !== null) return;
    fetch('/api/user/status')
      .then(r => r.json())
      .then(data => {
        setIsPro(data.isPro);
        setUser(data.user);
      })
      .catch(() => {
        setIsPro(false);
        setUser(null);
      });
  }, [user]);

  useEffect(() => {
    if (!loading) return;
    const timer = setInterval(() => {
      setProgress(p => (p >= 100 ? 100 : p + 20));
    }, 300);
    return () => clearInterval(timer);
  }, [loading]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!domain.trim()) return;

    setLoading(true);
    setProgress(0);
    setResults([]);
    setTotal(0);

    try {
      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      const data = await res.json();

      // PRO sees ALL, Free sees 5
      const displayResults = isPro ? data.results : data.results.slice(0, 5);
      setResults(displayResults);
      setTotal(data.total || 0);
    } catch (err) {
      alert('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const visible = results.length;
  const hidden = total - visible;

  const handleLogout = () => {
    document.cookie = 'userId=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    window.location.reload();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', padding: '40px 20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>NovaHunt Emails</h1>
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '32px' }}>Find business emails fast.</p>

      <form onSubmit={handleSearch} style={{ marginBottom: '40px' }}>
        <input
          type="text"
          placeholder="Enter domain (e.g. coca-cola.com)"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          style={{ padding: '12px 16px', width: '300px', maxWidth: '100%', border: '1px solid #ccc', borderRadius: '8px', fontSize: '16px' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '12px 24px', marginLeft: '8px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {loading && (
        <div style={{ margin: '20px 0' }}>
          <div style={{ width: '300px', margin: '0 auto' }}>
            <div style={{ height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '6px', backgroundColor: '#2563eb', width: `${progress}%`, transition: 'width 0.3s ease' }}></div>
            </div>
          </div>
          <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>{Math.round(progress)}% Complete</p>
        </div>
      )}

      {user && (
        <div style={{ margin: '10px 0', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
          <p style={{ color: '#10b981', fontWeight: 'bold', margin: 0, fontSize: '16px' }}>
            {isPro ? 'PRO User - Unlimited Access' : 'Free User'}
          </button>
          <button
            onClick={() => {
              document.cookie = 'userId=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
              window.location.reload();
            }}
            style={{ padding: '4px 8px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}
          >
            logout
          </button>
        </div>
      )}

      {results.length > 0 && (
        <>
          <p style={{ fontSize: '16px', color: '#444', margin: '20px 0' }}>
            Displaying <strong>{visible}</strong> of <strong>{total}</strong> emails.
            {!isPro && hidden > 0 && (
              <a href="/upgrade" style={{ color: '#dc2626', fontWeight: 'bold' }}>
                Upgrade to reveal all {hidden} →
              </a>
            )}
          </p>

          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Title</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{r.email}</td>
                    <td style={{ padding: '12px' }}>{r.first_name} {r.last_name}</td>
                    <td style={{ padding: '12px' }}>{r.position}</td>
                    <td style={{ padding: '12px' }}>{r.score}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!user && (
        <div style={{ marginTop: '60px' }}>
          <a href="/signin" style={{ color: '#2563eb', fontWeight: 'bold', textDecoration: 'none' }}>
            Sign In
          </a>
        </div>
      )}
    </div>
  );
}
