import React, { useState } from 'react';

/**
 * SearchInputPreview
 *
 * A lightweight, self-contained search input used only by the preview page.
 * - Does NOT touch or replace the existing SearchClient component (keeps homepage safe).
 * - Calls the same server endpoints as the app (/api/search-contacts, falls back to /api/search-contacts-mock).
 * - Calls onResults({ domain, result }) with a normalized result object.
 *
 * Usage: <SearchInputPreview onResults={(payload) => { ... }} />
 */

export default function SearchInputPreview({ onResults }) {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
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
    return {
      items: payload.items || payload.results || payload.data || [],
      total: payload.total ?? (payload.items ? payload.items.length : 0),
      public: payload.public ?? true,
    };
  };

  const tryFetch = async (url, body) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  const doSearch = async (explicitDomain) => {
    const d = (explicitDomain || domain || '').trim();
    if (!d) {
      setError('Please enter a domain (e.g. coca-cola.com)');
      return;
    }
    setError(null);
    setLoading(true);

    const body = { domain: d };
    let payload = null;
    try {
      payload = await tryFetch('/api/search-contacts', body);
    } catch (primaryErr) {
      try {
        payload = await tryFetch('/api/search-contacts-mock', body);
      } catch (mockErr) {
        setError('Search failed. Try again later.');
        setLoading(false);
        return;
      }
    }

    const normalized = normalizeResult(payload);
    if (typeof onResults === 'function') {
      try {
        onResults({ domain: d, result: normalized });
      } catch (cbErr) {
        // swallow parent callback errors
        // eslint-disable-next-line no-console
        console.warn('onResults callback error', cbErr);
      }
    }

    setLoading(false);
  };

  const handleSubmit = (e) => {
    e && e.preventDefault && e.preventDefault();
    doSearch();
  };

  return (
    <div style={{ width: '100%', marginBottom: 12 }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label htmlFor="preview-domain" style={{ display: 'none' }}>Domain</label>
        <input
          id="preview-domain"
          name="preview-domain"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="Enter domain, e.g. coca-cola.com"
          style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }}
          aria-label="Domain"
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: 'none',
            background: '#0366d6',
            color: '#fff',
            cursor: loading ? 'default' : 'pointer',
            fontWeight: 700,
          }}
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && <div style={{ color: '#b00020', marginTop: 10 }}>{error}</div>}
    </div>
  );
}
