'use client';
import React, { useState, useEffect } from 'react';
import ResultItem from './ResultItem';

/**
 * SearchClient — improved department normalization and priority ordering.
 * It calls onResults({ domain, result }) so parent can show CompanyProfile.
 */
export default function SearchClient({ onResults }) {
  const INITIAL_PAGES = 3;
  const [domain, setDomain] = useState('');
  const [pages, setPages] = useState(INITIAL_PAGES);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({ items: [], total: 0, public: true });
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Priority list — higher importance first (edit as you like)
  const DEPT_PRIORITY = [
    'Executive', 'Executives', 'C-Suite', 'CEO', 'Founder', 'Co-Founder',
    'Management', 'Leadership',
    'Sales', 'Account', 'Business Development',
    'Marketing', 'Communications', 'PR', 'Brand',
    'Product', 'Design',
    'Engineering', 'Dev', 'Technology',
    'Operations', 'Finance', 'Legal', 'HR',
    'Support', 'Customer Success',
    'Other'
  ];

  // Map likely department/title keywords to canonical department keys
  function normalizeDepartment(raw) {
    if (!raw || !raw.trim()) return 'Other';
    const s = raw.trim().toLowerCase();
    if (/(ceo|chief executive|cxo|c-suite|executive)/i.test(s)) return 'Executives';
    if (/(founder|co-?founder|owner)/i.test(s)) return 'Executives';
    if (/(vp|vice president|director|head of|manager|management)/i.test(s)) return 'Management';
    if (/(sales|account executive|business development|bd)/i.test(s)) return 'Sales';
    if (/(marketing|communications|media|pr|brand)/i.test(s)) return 'Marketing';
    if (/(product|pm |product manager|product owner)/i.test(s)) return 'Product';
    if (/(engineer|developer|devops|technology|cto)/i.test(s)) return 'Engineering';
    if (/(support|customer success|cs|service)/i.test(s)) return 'Support';
    if (/(operations|ops)/i.test(s)) return 'Operations';
    if (/(finance|legal|hr|people)/i.test(s)) return 'Operations';
    // default: keep original capitalized-ish
    return raw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

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

      // normalize department fields for incoming items
      const incoming = (json.items || []).map(it => {
        const deptRaw = (it.department || it.title || '').trim();
        return Object.assign({}, it, { department: normalizeDepartment(deptRaw) });
      });

      if (append) {
        setResult(prev => {
          const merged = mergeItems(prev.items || [], incoming);
          const newResult = { items: merged, total: json.total || merged.length, public: json.public };
          if (typeof onResults === 'function') onResults({ domain: reqDomain, result: newResult });
          return newResult;
        });
      } else {
        const newResult = { items: incoming, total: json.total || 0, public: json.public };
        setResult(newResult);
        if (typeof onResults === 'function') onResults({ domain: reqDomain, result: newResult });
      }
    } catch (e) {
      setError(e.message || String(e));
      const newResult = { items: [], total: 0, public: true };
      setResult(newResult);
      if (typeof onResults === 'function') onResults({ domain: reqDomain, result: newResult });
    } finally {
      setLoading(false);
    }
  }

  function onSearch(e) {
    e && e.preventDefault && e.preventDefault();
    const d = (domain || '').trim();
    if (!d) return;
    setPages(INITIAL_PAGES);
    setHasSearched(true);
    fetchResults(d, INITIAL_PAGES, false);
  }

  function onLoadMore() {
    const next = pages + 1;
    setPages(next);
    fetchResults(domain.trim(), next, true);
  }

  useEffect(() => {
    if (!domain) {
      setHasSearched(false);
      setResult({ items: [], total: 0, public: true });
      setPages(INITIAL_PAGES);
      if (typeof onResults === 'function') onResults({ domain: '', result: { items: [], total: 0, public: true } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain]);

  // Group by department (normalized), order groups by DEPT_PRIORITY,
  // and sort items within a group by confidence (desc) then name.
  function groupByDepartment(items = []) {
    const groups = {};
    items.forEach(it => {
      const key = (it.department || 'Other') || 'Other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(it);
    });

    // for each group's items, sort by confidence desc then name
    Object.keys(groups).forEach(k => {
      groups[k].sort((a, b) => {
        const ca = (a.confidence || a.score || 0);
        const cb = (b.confidence || b.score || 0);
        if (cb !== ca) return cb - ca;
        return (a.name || '').localeCompare(b.name || '');
      });
    });

    const ordered = [];
    DEPT_PRIORITY.forEach(p => {
      // find group keys that include the priority string (case-insensitive)
      const matchKey = Object.keys(groups).find(k => k.toLowerCase() === p.toLowerCase());
      if (matchKey) {
        ordered.push({ name: matchKey, items: groups[matchKey] });
        delete groups[matchKey];
      }
    });

    // remaining groups alphabetically
    Object.keys(groups).sort().forEach(k => ordered.push({ name: k, items: groups[k] }));
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
          style={{ flex: 1, padding: 12, fontSize: 15 }}
        />
        <button type="submit" style={{ padding: '10px 14px' }}>
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
                <div style={{
                  display: 'inline-block',
                  background: '#fff3ee',
                  color: '#7a341f',
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontWeight: 700,
                  marginBottom: 8
                }}>
                  {group.name} <span style={{ fontWeight: 500, color: '#7a341f', marginLeft: 8 }}>({group.items.length})</span>
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
