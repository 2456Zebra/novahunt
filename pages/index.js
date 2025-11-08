// pages/index.js — GUARANTEED RENDER: INLINE STYLES + EMAILS (NO TAILWIND/DEPS)
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
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      color: '#111827',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      lineHeight: 1.5
    }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#ffffff',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>NovaHunt</h1>
            <nav style={{ display: 'flex', gap: '1rem' }}>
              <a href="/upgrade" style={{ color: '#2563eb', fontWeight: '500', textDecoration: 'none' }}>Upgrade $10/mo</a>
              <a href="/signin" style={{ color: '#374151', fontWeight: '500', textDecoration: 'none' }}>Sign In</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '3rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
          Find Any Business Email
        </h2>
        <p style={{ fontSize: '1.25rem', color: '#6b7280', marginBottom: '3rem', maxWidth: '32rem', marginLeft: 'auto', marginRight: 'auto' }}>
          AI-powered email hunter. Real results from public sources. Unlimited with PRO.
        </p>

        {/* Search Bar */}
        <div style={{ maxWidth: '32rem', marginLeft: 'auto', marginRight: 'auto', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="e.g., vercel.com"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                fontSize: '1.125rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: loading ? '#9ca3af' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Hunting...' : 'Hunt Emails'}
            </button>
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
            Free trial: 5 searches | <a href="/upgrade" style={{ color: '#2563eb', textDecoration: 'underline' }}>Go PRO for unlimited</a>
          </p>
        </div>

        {/* Message */}
        {message && (
          <p style={{
            fontSize: '1.125rem',
            fontWeight: '500',
            marginBottom: '1rem',
            color: results.length > 0 ? '#059669' : '#6b7280'
          }}>
            {message}
          </p>
        )}

        {/* Results Table */}
        {results.length > 0 && (
          <div style={{
            maxWidth: '64rem',
            marginLeft: 'auto',
            marginRight: 'auto',
            backgroundColor: '#f9fafb',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111827' }}>
              {results.length} Emails Found
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Email</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Role</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>{r.email}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>{r.role || 'Unknown'}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        backgroundColor: r.score > 80 ? '#d1fae5' : '#fef3c7',
                        color: r.score > 80 ? '#065f46' : '#92400e'
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
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#f9fafb',
        borderTop: '1px solid #e5e7eb',
        marginTop: '4rem',
        padding: '2rem 1.5rem',
        textAlign: 'center',
        fontSize: '0.875rem',
        color: '#6b7280'
      }}>
        © 2025 NovaHunt. Built for email hunters. <a href="/upgrade" style={{ color: '#2563eb', textDecoration: 'underline' }}>Start PRO trial</a>
      </footer>
    </div>
  );
}
