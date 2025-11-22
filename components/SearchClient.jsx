import React, { useState } from 'react';

/**
 * SearchClient
 *
 * Props:
 *  - onResults: function({ domain, result }) called after a successful search
 *  - showResults: boolean (default true) - whether this component should render the internal results UI
 *
 * Notes:
 * - Posts { domain } to /api/search-contacts (server) and calls onResults with the returned payload.
 * - Falls back to /api/search-contacts-mock if the primary endpoint fails.
 * - Keeps the internal results rendering behind the showResults prop so pages can choose to render results elsewhere.
 */

export default function SearchClient({ onResults, showResults = true }) {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({ items: [], total: 0, public: true });
  const [error, setError] = useState(null);

  const normalizeResult = (payload) => {
    // Normalizes different shapes from the API to { items: [], total, public }
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
    // If the API returns an array directly
    if (Array.isArray(payload)) return { items: payload, total: payload.length, public: true };
    // Fallback - try to extract .items or .results
    return {
      items: payload.items || payload.results || payload.data || [],
      total: payload.total ?? (payload.items ? payload.items.length : 0),
      public: payload.public ?? true,
    };
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

    // Try the primary endpoint first
    const tryFetch = async (url) => {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (e) {
        // bubble up to caller to try fallback
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

    // Notify parent
    if (typeof onResults === 'function') {
      try {
        onResults({ domain: domainToSearch, result: normalized });
      } catch (err) {
        // swallow parent callback errors
        // eslint-disable-next-line no-console
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

      {error && <div style={{ color: '#b00020', marginBottom: 12 }}>{error}</div>}

      {/* Internal results rendering (guarded by showResults) */}
      {showResults && (
        <div style={{ marginTop: 8 }}>
          <h2 style={{ marginTop: 0 }}>Search Results</h2>

          {result?.items?.length === 0 && <div style={{ color: '#666' }}>No results found. Try different keywords or filters.</div>}

          {result?.items?.length > 0 && (
            <div style={{ display: 'grid', gap: 8 }}>
              {result.items.map((it, idx) => {
                const name = it.name || it.fullName || it.title || it.email || `Result ${idx + 1}`;
                const role = it.role || it.department || it.section || it.title || '';
                const trust = it.trust ? `${it.trust}%` : '';
                const source = it.source || '';
                const maskedEmail = it.email ? it.email.replace(/(^[^@]{1})[^@]*(@.*)$/, (m, a, b) => `${a}*****${b}`) : '';

                return (
                  <div key={idx} style={{ padding: 10, borderRadius: 8, border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{name}</div>
                      <div style={{ color: '#666', fontSize: 13 }}>{role}</div>
                      <div style={{ color: '#444', marginTop: 6 }}>{maskedEmail}</div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: '#666' }}>{trust}</div>
                      <div style={{ marginTop: 8 }}>
                        <button
                          onClick={() => {
                            // Reveal interaction can be implemented later. For now, no-op or call an API.
                            // leave as a placeholder for the Reveal action.
                          }}
                          style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                        >
                          Reveal
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
