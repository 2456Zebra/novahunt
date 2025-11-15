import React, { useState } from 'react';
import Head from 'next/head';

export default function SearchPage() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  async function doSearch(e) {
    e && e.preventDefault();
    setError(null);
    setResults(null);

    const d = (domain || '').trim();
    if (!d) {
      setError('Please enter a domain (e.g. example.com)');
      return;
    }

    setLoading(true);
    try {
      const sessionValue = typeof window !== 'undefined' ? localStorage.getItem('nh_session') || '' : '';
      const res = await fetch('/api/search-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nh-session': sessionValue,
        },
        body: JSON.stringify({ domain: d, limit: 20 })
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error || 'Search failed');
      } else {
        setResults(body?.data || body); // support both shapes
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Search — NovaHunt</title>
      </Head>

      <main style={{ maxWidth: 980, margin: '0 auto', padding: 24 }}>
        <h1>Search</h1>
        <p>Enter a domain to search for contacts and email addresses.</p>

        <form onSubmit={doSearch} style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            style={{ padding: 8, width: 360 }}
            aria-label="domain"
          />
          <button type="submit" style={{ padding: '8px 12px' }} disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>

        {error && <div style={{ marginTop: 12, color: '#ef4444' }}>{error}</div>}

        {results && (
          <div style={{ marginTop: 18 }}>
            <h2>Results</h2>

            {/* Hunter response shape: results.data.data.emails or results.data */}
            {Array.isArray(results?.data?.data?.emails) && results.data.data.emails.length === 0 && (
              <div>No emails found.</div>
            )}

            {Array.isArray(results?.data?.data?.emails) && results.data.data.emails.length > 0 && (
              <div style={{ display: 'grid', gap: 12 }}>
                {results.data.data.emails.map((e, i) => (
                  <div key={i} style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
                    <div style={{ fontWeight: 700 }}>{e.value}</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>{e.position || e.type || ''}</div>
                    <div style={{ marginTop: 8, fontSize: 13 }}>
                      Sources: {(e.sources || []).length} — Verification: {e.verification?.status || 'unknown'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Generic payload */}
            {!results?.data && Array.isArray(results) && results.length === 0 && <div>No results.</div>}
            {!results?.data && Array.isArray(results) && results.length > 0 && (
              <div style={{ display: 'grid', gap: 12 }}>
                {results.map((r, i) => (
                  <pre key={i} style={{ padding: 12, border: '1px solid #eee', borderRadius: 8, whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(r, null, 2)}
                  </pre>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
