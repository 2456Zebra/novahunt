// File: components/SearchClient.jsx
import React, { useState } from 'react';

export default function SearchClient({ onResults, showResults = true }) {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({ items: [], total: 0, public: true });
  const [error, setError] = useState(null);

  const normalizeResult = (payload) => {
    if (!payload) return { items: [], total: 0, public: true };
    if (payload.results && Array.isArray(payload.results)) {
      return { items: payload.results, total: payload.total ?? payload.results.length, public: payload.public ?? true };
    }
    if (payload.data && Array.isArray(payload.data.items)) {
      return { items: payload.data.items, total: payload.data.total ?? payload.data.items.length, public: payload.data.public ?? true };
    }
    if (Array.isArray(payload.items)) {
      return { items: payload.items, total: payload.total ?? payload.items.length, public: payload.public ?? true };
    }
    if (Array.isArray(payload)) return { items: payload, total: payload.length, public: true };
    return { items: payload.items || payload.results || payload.data || [], total: payload.total ?? 0, public: payload.public ?? true };
  };

  const doSearch = async (d) => {
    const domainToSearch = (d || domain || '').trim();
    if (!domainToSearch) {
      setError('Please enter a domain (e.g. coca-cola.com)');
      return;
    }

    setLoading(true);
    setError(null);

    const body = { domain: domainToSearch };

    const tryFetch = async (url) => {
      try {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (e) {
        throw e;
      }
    };

    let payload = null;
    try {
      payload = await tryFetch('/api/search-contacts');
    } catch (errPrimary) {
      try {
        payload = await tryFetch('/api/search-contacts-mock');
      } catch (errMock) {
        setError('Search failed. Try again.');
        setLoading(false);
        return;
      }
    }

    const normalized = normalizeResult(payload);
    setResult(normalized);

    if (typeof onResults === 'function') {
      try {
        onResults({ domain: domainToSearch, result: normalized });
      } catch (err) {
        console.warn('onResults callback error', err);
      }
    }

    setLoading(false);
  };

  const handleSubmit = (e) => {
    e && e.preventDefault && e.preventDefault();
    doSearch();
  };

  return (
    <div style={{ width: '100%' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <label htmlFor="domain" style={{ display: 'none' }}>Domain</label>
        <input
          id="domain"
          name="domain"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="Enter domain, e.g. coca-cola.com"
          style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }}
          aria-label="Domain"
        />
        <button type="submit" disabled={loading} style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: '#0366d6', color: '#fff', cursor: loading ? 'default' : 'pointer', fontWeight: 700 }}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && <div style={{ color: '#b00020', marginBottom: 12 }}>{error}</div>}

      {showResults && result?.items?.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <h2 style={{ marginTop: 0 }}>Search Results ({result.total})</h2>
          <ul>
            {result.items.map((it, idx) => {
              const maskedEmail = it.email ? it.email.replace(/(^[^@]{1})[^@]*(@.*)$/, (m, a, b) => `${a}*****${b}`) : '';
              return (
                <li key={idx} style={{ marginBottom: 12, padding: 10, border: '1px solid #eee', borderRadius: 8 }}>
                  <div style={{ fontWeight: 700 }}>{it.name || it.fullName || it.email}</div>
                  <div style={{ color: '#666', fontSize: 13 }}>{it.role || it.department || ''}</div>
                  <div style={{ color: '#444', marginTop: 6 }}>{maskedEmail}</div>
                  <div style={{ marginTop: 8 }}>
                    <button style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>
                      Reveal
                    </button>
                    {it.source && <a href={it.source} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 6 }}>Source</a>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
