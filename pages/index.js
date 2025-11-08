// pages/index.js — MINIMAL, INLINE STYLES, NO DEPS
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
    <div style={{ minHeight: '100vh', backgroundColor: 'white', color: 'black', fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', fontSize: '32px', color: 'blue' }}>NovaHunt Emails</h1>
      <p style={{ textAlign: 'center', fontSize: '18px', color: 'gray' }}>Find business emails fast.</p>
      
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <input
          type="text"
          placeholder="Enter domain e.g. vercel.com"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ padding: '10px', width: '300px', marginRight: '10px' }}
        />
        <button onClick={handleSearch} disabled={loading} style={{ padding: '10px 20px', backgroundColor: 'blue', color: 'white' }}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {message && <p style={{ textAlign: 'center' }}>{message}</p>}

      {results.length > 0 && (
        <div style={{ margin: '20px 0' }}>
          <h2 style={{ textAlign: 'center' }}>{results.length} Emails Found</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid gray' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid gray', padding: '10px' }}>Email</th>
                <th style={{ border: '1px solid gray', padding: '10px' }}>Role</th>
                <th style={{ border: '1px solid gray', padding: '10px' }}>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td style={{ border: '1px solid gray', padding: '10px' }}>{r.email}</td>
                  <td style={{ border: '1px solid gray', padding: '10px' }}>{r.role}</td>
                  <td style={{ border: '1px solid gray', padding: '10px' }}>{r.score}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <a href="/upgrade" style={{ color: 'blue', textDecoration: 'underline' }}>Upgrade to PRO - $10/mo</a>
      </div>
    </div>
  );
}
