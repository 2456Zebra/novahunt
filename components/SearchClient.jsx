import React, { useCallback, useEffect, useState } from 'react';
import ClientOnly from './ClientOnly';
import SearchInputPreview from './SearchInputPreview';
import SearchResults from './SearchResults';
import RightPanel from './RightPanel';

/**
 * SearchClient
 *
 * - Renders a search input (SearchInputPreview) and, after the user searches,
 *   shows results (SearchResults) and a right-hand panel (RightPanel).
 * - Client-only dynamic parts (results + right panel) are wrapped with ClientOnly
 *   to avoid server/client hydration mismatches.
 *
 * NOTE: This implementation uses the existing /api/find-emails endpoint to fetch
 * results. It keeps the payload shape generic (expects { items, total, company? }).
 * If your existing backend returns a different shape, adapt the fetch/response handling below.
 */

export default function SearchClient() {
  const [domain, setDomain] = useState('');
  const [querying, setQuerying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const performSearch = useCallback(async (d) => {
    if (!d) return;
    setQuerying(true);
    setError(null);
    setResult(null);

    try {
      // default to 3 pages (server supports pages param)
      const url = `/api/find-emails?domain=${encodeURIComponent(d)}&pages=3`;
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Search API error ${res.status}: ${text}`);
      }
      const payload = await res.json();
      // normalize result shape if needed
      setResult(payload);
    } catch (err) {
      console.error('Search failed', err);
      setError(err.message || 'Search failed');
    } finally {
      setQuerying(false);
    }
  }, []);

  // Handler wired to the input component
  const handleSubmit = async (value) => {
    const cleaned = (value || '').trim();
    if (!cleaned) return;
    setDomain(cleaned);
    await performSearch(cleaned);
  };

  // Optional: if you want to auto-run a search from a query param (e.g., ?domain=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      const q = params.get('domain');
      if (q) {
        const normalized = q.trim();
        setDomain(normalized);
        performSearch(normalized);
      }
    } catch (e) {
      // ignore in SSR
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <SearchInputPreview
          defaultValue={domain}
          onSubmit={handleSubmit}
          loading={querying}
          placeholder="Enter a company website (example: coca-cola.com)"
        />

        {error && (
          <div style={{ marginTop: 12, color: '#DC2626' }}>
            {error}
          </div>
        )}

        {/* Dynamic area: render only on client to avoid hydration mismatch */}
        <ClientOnly fallback={<div style={{ minHeight: 260 }} />}>
          <div style={{ display: 'flex', gap: 20, marginTop: 18 }}>
            <div style={{ flex: 1 }}>
              <SearchResults
                domain={domain}
                result={result}
                loading={querying}
              />
            </div>

            <div style={{ width: 360 }}>
              <RightPanel
                domain={domain}
                result={result}
              />
            </div>
          </div>
        </ClientOnly>
      </div>
    </div>
  );
}
