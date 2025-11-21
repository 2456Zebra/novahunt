'use client';
import React, { useState, useEffect } from 'react';
import ResultItem from './ResultItem';

/**
 * SearchClient — user-facing search UI.
 * - Only shows results area after a search is performed (hasSearched).
 * - Shows "Load more" only when there are more results to fetch.
 * - Fetches pages via ?pages=N (API supports pages param).
 */
export default function SearchClient() {
  const [domain, setDomain] = useState('');
  const [pages, setPages] = useState(1); // start with 1 page
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({ items: [], total: 0, public: true });
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  async function fetchResults(reqDomain, reqPages) {
    if (!reqDomain) return;
    setLoading(true);
    setError('');
    try {
      const q = new URLSearchParams({ domain: reqDomain, pages: String(reqPages) });
      const res = await fetch(`/api/find-emails?${q.toString()}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'API error');
      setResult(json);
    } catch (e) {
      setError(e.message || String(e));
      setResult({ items: [], total: 0, public: true });
    } finally {
      setLoading(false);
    }
  }

  function onSearch(e) {
    e && e.preventDefault && e.preventDefault();
    const d = (domain || '').trim();
    if (!d) return;
    // reset pages and perform search
    setPages(1);
    setHasSearched(true);
    fetchResults(d, 1);
  }

  function onLoadMore() {
    const next = pages + 1;
    setPages(next);
    fetchResults(domain.trim(), next);
  }

  useEffect(() => {
    // if domain cleared, hide results area
    if (!domain) {
      setHasSearched(false);
      setResult({ items: [], total: 0, public: true });
      setPages(1);
    }
  }, [domain]);

  return (
    <div style={{ marginTop: 20 }}>
      <form onSubmit={onSearch} style={{ display: 'flex', gap: 8 }}>
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="Enter domain, e.g. coca-cola.com"
          style={{ flex: 1, padding: 10 }}
        />
        <button type="submit" style={{ padding: '8px 12px' }}>
          Search
        </button>
      </form>

      {loading ? <div style={{ marginTop: 12 }}>Loading results...</div> : null}
      {error ? <div style={{ marginTop: 12, color: 'red' }}>Error: {error}</div> : null}

      {/* Only show result summary and list after the user has searched at least once */}
      {hasSearched ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            Showing {result.items.length} of {result.total} results {result.public ? '(public)' : ''}
          </div>

          <div style={{ marginTop: 8 }}>
            {/* Group by department if present */}
            {(() => {
              const groups = {};
              (result.items || []).forEach(it => {
                const key = (it.department && it.department.trim()) ? it.department.trim() : 'Other';
                if (!groups[key]) groups[key] = [];
                groups[key].push(it);
              });
              return Object.keys(groups).map((dept) => (
                <div key={dept} style={{ marginTop: 12 }}>
                  {dept !== 'Other' ? <div style={{ fontWeight: 700, marginBottom: 6 }}>{dept}</div> : null}
                  {groups[dept].map((it, idx) => (
                    <ResultItem key={(it.email || it.maskedEmail || idx)} item={it} isSignedIn={false} />
                  ))}
                </div>
              ));
            })()}
          </div>

          {/* Show Load more only when we actually have results and there are more to fetch */}
          {result.items.length > 0 && result.total > result.items.length ? (
            <div style={{ marginTop: 12 }}>
              <button onClick={onLoadMore} style={{ padding: '8px 12px' }} disabled={loading}>
                {loading ? 'Loading...' : `Load more (page ${pages + 1})`}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
