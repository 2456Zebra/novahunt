'use client';
import React, { useState, useEffect } from 'react';
import ResultItem from './ResultItem';

/**
 * SearchClient — handles searching, grouping by department, prioritized ordering,
 * merging results when loading more pages, and showing counts per department.
 */
export default function SearchClient() {
  const [domain, setDomain] = useState('');
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({ items: [], total: 0, public: true });
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Priority order for departments (higher importance first)
  const DEPT_PRIORITY = [
    'Executive',
    'Executives',
    'C-Suite',
    'Management',
    'Leadership',
    'Sales',
    'Marketing',
    'Product',
    'Engineering',
    'Operations',
    'Support',
    'Other'
  ];

  // Merge and dedupe items by email (email or maskedEmail key)
  function mergeItems(existing = [], incoming = []) {
    const map = new Map();
    existing.forEach(it => {
      const key = (it.email || it.maskedEmail || '').toLowerCase() || (`_i_${Math.random()}`);
      map.set(key, it);
    });
    incoming.forEach(it => {
      const key = (it.email || it.maskedEmail || '').toLowerCase() || (`_i_${Math.random()}`);
      map.set(key, it);
    });
    return Array.from(map.values());
  }

  async function fetchResults(reqDomain, reqPages, append = false) {
    if (!reqDomain) return;
    setLoading(true);
    setError('');
    try {
      const q = new URLSearchParams({ domain: reqDomain, pages: String(reqPages) });
      const res = await fetch(`/api/find-emails?${q.toString()}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'API error');
      if (append) {
        setResult(prev => {
          // merge and keep API's reported total/public flag
          const merged = mergeItems(prev.items || [], json.items || []);
          return { items: merged, total: json.total || merged.length, public: json.public };
        });
      } else {
        setResult({ items: json.items || [], total: json.total || 0, public: json.public });
      }
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
    setPages(1);
    setHasSearched(true);
    fetchResults(d, 1, false);
  }

  function onLoadMore() {
    const next = pages + 1;
    setPages(next);
    // append: true merges with existing items
    fetchResults(domain.trim(), next, true);
  }

  useEffect(() => {
    if (!domain) {
      setHasSearched(false);
      setResult({ items: [], total: 0, public: true });
      setPages(1);
    }
  }, [domain]);

  // Group items by department, normalized
  function groupByDepartment(items = []) {
    const groups = {};
    items.forEach(it => {
      const raw = (it.department || '').trim();
      const key = raw ? raw : 'Other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(it);
    });

    // Order groups by DEPT_PRIORITY, then alphabetically for remaining
    const ordered = [];
    DEPT_PRIORITY.forEach(p => {
      if (groups[p]) {
        ordered.push({ name: p, items: groups[p] });
        delete groups[p];
      }
    });
    // remaining keys
    Object.keys(groups).sort().forEach(k => {
      ordered.push({ name: k, items: groups[k] });
    });
    return ordered;
  }

  const grouped = groupByDepartment(result.items || []);

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

      {hasSearched ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            Showing {result.items.length} of {result.total} results {result.public ? '(public)' : ''}
          </div>

          <div style={{ marginTop: 8 }}>
            {grouped.map(group => (
              <div key={group.name} style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{group.name}{` (${group.items.length})`}</div>
                </div>
                {group.items.map((it, idx) => (
                  <ResultItem key={(it.email || it.maskedEmail || `${group.name}_${idx}`)} item={it} isSignedIn={false} />
                ))}
              </div>
            ))}
          </div>

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
