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
    fetch('/api/user/status')
      .then(r => r.json())
      .then(data => {
        setIsPro(data.isPro);
        setUser(data.user);
      });
  }, []);

  useEffect(() => {
    if (!loading) return;
    const timer = setInterval(() => setProgress(p => Math.min(100, p + 20)), 400);
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

      const displayResults = isPro ? data.results : data.results.slice(0, 5);
      setResults(displayResults);
      setTotal(data.total || 0);
    } catch (err) {
      alert('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear cookie
    document.cookie = 'userId=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    // Force reload
    window.location.reload(true);
  };

  const visible = results.length;
  const hidden = total - visible;

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
          <p
