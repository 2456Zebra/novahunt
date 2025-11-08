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
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '2rem', background: '#fff', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '1rem' }}>
        NovaHunt Emails
      </h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
        Find any business email in seconds — for less than a coffee.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Enter company domain (e.g. vercel.com)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          style={{ flex: 1, padding: '0.75rem', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '6px' }}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Hunting...' : 'Hunt Emails'}
        </button>
      </div>

      <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
        <a href="/upgrade" style={{ color: '#0070f3', fontWeight: 'bold' }}>
          Upgrade to PRO — $10/month unlimited →
        </a>
      </div>

      {message && <p style={{ textAlign: 'center', color: results.length > 0 ? 'green' : '#666' }}>{message}</p>}

      {results.length > 0 && (
        <div style={{ marginTop: '2rem', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f7f7f7' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Role</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: '1rem' }}>{r.email}</td>
                  <td style={{ padding: '1rem' }}>{r.role || '—'}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      background: r.score > 80 ? '#d4edda' : '#fff3cd', 
                      color: r.score > 80 ? '#155724' : '#856404'
                    }}>
                      {r.score}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
