// pages/index.js
import { useState } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    setMessage('');

    try {
      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: query })
      });
      const data = await res.json();
      setResults(data.results || []);
      setMessage(data.message || 'No emails found.');
    } catch (err) {
      setMessage('Search failed. Try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#fff', color: '#000', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ padding: '1rem 2rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0 }}>NovaHunt</h1>
        <nav>
          <a href="/upgrade" style={{ marginLeft: '1rem', color: '#0070f3', fontWeight: 'bold' }}>Upgrade</a>
          <a href="/signin" style={{ marginLeft: '1rem', color: '#0070f3' }}>Sign In</a>
        </nav>
      </header>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '4rem 2rem', background: '#f8f9fa' }}>
        <h2 style={{ fontSize: '2.8rem', fontWeight: 'bold', marginBottom: '1rem' }}>Find Any Business Email</h2>
        <p style={{ fontSize: '1.2rem', color: '#666', maxWidth: '600px', margin: '0 auto 2rem' }}>
          AI-powered email hunter. Real results. No fluff.
        </p>

        <div style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Enter domain (e.g. vercel.com)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            style={{ flex: 1, padding: '1rem', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              padding: '1rem 2rem',
              background: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Hunting...' : 'Hunt'}
          </button>
        </div>

        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#999' }}>
          Free: 5 searches/mo | PRO: Unlimited — <a href="/upgrade" style={{ color: '#0070f3' }}>$10/month</a>
        </p>
      </section>

      {/* Results */}
      {message && (
        <section style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: results.length > 0 ? '#155724' : '#666', fontWeight: results.length > 0 ? 'bold' : 'normal' }}>
            {message}
          </p>
        </section>
      )}

      {results.length > 0 && (
        <section style={{ padding: '0 2rem 4rem', maxWidth: '800px', margin: '0 auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ background: '#f7f7f7' }}>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Email</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Role</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '1rem' }}>{r.email}</td>
                  <td style={{ padding: '1rem' }}>{r.role || '—'}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      background: r.score > 80 ? '#d4edda' : '#fff3cd',
                      color: r.score > 80 ? '#155724' : '#856404',
                      fontWeight: 'bold'
                    }}>
                      {r.score}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '2rem', color: '#999', fontSize: '0.9rem', borderTop: '1px solid #eee' }}>
        © 2025 NovaHunt. For the price of a coffee, hunt emails like a pro.
      </footer>
    </div>
  );
}
