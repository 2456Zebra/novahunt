import { useState } from 'react';

export default function Home() {
  const [domain, setDomain] = useState('');
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!domain) return;

    setLoading(true);
    setResults([]);
    setTotal(0);
    setMessage('');

    try {
      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });
      const data = await res.json();
      setResults((data.results || []).slice(0, 5));
      setTotal(data.total || data.results?.length || 0);
      setMessage(data.message || '');
    } catch (err) {
      setMessage('Error: Try again.');
    } finally {
      setLoading(false);
    }
  };

  const visible = results.length;
  const hidden = Math.max(0, total - visible);

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

      {message && <p style={{ color: '#10b981', fontWeight: 'bold' }}>{message}</p>}

      {visible > 0 && (
        <>
          <p style={{ fontSize: '16px', color: '#444', margin: '20px 0' }}>
            Displaying <strong>{visible}</strong> of <strong>{total}</strong> emails.{' '}
            {hidden > 0 && (
              <a href="/upgrade" style={{ color: '#dc2626', fontWeight: 'bold' }}>
                Upgrade to reveal all {hidden} →
              </a>
            )}
          </p>

          <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
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
                    <td style={{ padding: '12px' }}>{r.position || 'Unknown'}</td>
                    <td style={{ padding: '12px' }}>{r.score}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div style={{ marginTop: '60px' }}>
        <a href="/upgrade" style={{ color: '#2563eb', fontWeight: 'bold', textDecoration: 'none' }}>
          Upgrade to PRO - $10/mo
        </a>
      </div>
    </div>
  );
}
