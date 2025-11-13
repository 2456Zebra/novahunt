'use client';

import React, { useState } from 'react';

/**
 * Client-only search widget.
 * Prevents full page submits and calls the server-side /api/hunter-search endpoint.
 */
export default function SearchClient() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResults(null);

    const trimmed = (domain || '').trim();
    if (!trimmed) {
      setError('Please enter a domain (e.g. example.com)');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/hunter-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: trimmed }),
      });

      if (!res.ok) {
        const txt = await res.text();
        setError(`API error: ${res.status} ${txt}`);
        setLoading(false);
        return;
      }

      const payload = await res.json();

      // Normalize common shapes from Hunter API responses
      // Hunter v2 typically returns { data: { emails: [...] } }
      const emails =
        payload?.data?.data?.emails ||
        payload?.data?.emails ||
        payload?.emails ||
        [];

      setResults({ raw: payload, emails });
    } catch (err) {
      setError(err?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '1rem' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          placeholder="Enter domain (e.g. fordmodels.com)"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          style={{ flex: 1, padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc' }}
        />
        <button
          type="submit"
          style={{
            padding: '0.6rem 1rem',
            background: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
          disabled={loading}
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {loading && (
        <div style={{ marginTop: 12 }}>
          <div style={{ height: 8, background: '#eee', borderRadius: 999 }}>
            <div style={{ height: 8, width: '60%', background: '#0070f3', borderRadius: 999, transition: 'width .3s' }} />
          </div>
        </div>
      )}

      {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}

      {results && (
        <div style={{ marginTop: 16 }}>
          <h3>Results</h3>

          {Array.isArray(results.emails) && results.emails.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {results.emails.map((em, i) => (
                  <tr key={i}>
                    <td style={{ padding: 8, borderBottom: '1px solid #fafafa' }}>{em.value || em.email}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid #fafafa' }}>{em.type || em.source || '-'}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid #fafafa' }}>{em.confidence ?? em.score ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No emails returned for this domain.</p>
          )}

          <details style={{ marginTop: 12 }}>
            <summary>Raw response (debug)</summary>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, maxHeight: 300, overflow: 'auto', background: '#f7f7f7', padding: 8 }}>
              {JSON.stringify(results.raw, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
