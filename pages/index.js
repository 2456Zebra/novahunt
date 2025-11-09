import { useState } from 'react';

export default function Home() {
  const [domain, setDomain] = useState('');
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!domain) return;

    setLoading(true);
    setResults([]);
    setTotal(0);

    try {
      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });
      const data = await res.json();
      setResults((data.results || []).slice(0, 5));
      setTotal(data.total || 0);
    } catch (err) {
      alert('Search failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const visible = results.length;
  const hidden = total - visible;

  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>NovaHunt</h1>
      <p style={{ color: '#666', marginBottom: '32px' }}>Find business emails instantly.</p>

      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="coca-cola.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          style={{ padding: '12px', width: '300px', border: '1px solid #ccc', borderRadius: '8px' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '12px 24px', marginLeft: '8px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px' }}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {visible > 0 && (
        <>
          <p style={{ margin: '24px 0', color: '#444' }}>
            Displaying <strong>{visible}</strong> of <strong>{total}</strong> emails.{' '}
            {hidden > 0 && (
              <a href="/upgrade" style={{ color: '#dc2626', fontWeight: 'bold' }}>
                Upgrade to see all {hidden} →
              </a>
            )}
          </p>

          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Title</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Score</th>
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

      <div style={{ marginTop: '60px' }}>
        <a href="/upgrade" style={{ color: '#2563eb', fontWeight: 'bold' }}>
          Upgrade to PRO - $10/mo
        </a>
      </div>
    </div>
  );
}
