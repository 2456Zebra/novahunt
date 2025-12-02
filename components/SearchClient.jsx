import React, { useCallback, useEffect, useState } from 'react';
import ClientOnly from './ClientOnly';
import SearchResults from './SearchResults';
import RightPanel from './RightPanel';
import { canSearch, incrementSearch } from '../lib/auth-client';

export default function SearchClient({ onResults }) {
  const [domain, setDomain] = useState('');
  const [querying, setQuerying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      const q = params.get('domain');
      if (q) {
        const normalized = q.trim();
        setDomain(normalized);
        performSearch(normalized);
      }
    } catch (e) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const performSearch = useCallback(async (d) => {
    if (!d) return;

    // enforce search limit
    if (!canSearch()) {
      try { window.dispatchEvent(new CustomEvent('nh_limit_reached', { detail: { type: 'search' } })); } catch (e) {}
      return;
    }

    setQuerying(true);
    setError(null);
    setResult(null);

    try {
      const url = `/api/find-emails?domain=${encodeURIComponent(d)}&pages=3`;
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Search API error ${res.status}: ${text}`);
      }
      const payload = await res.json();
      setResult(payload);

      // increment search usage (we already checked canSearch above)
      try { incrementSearch(); } catch (e) {}

      if (typeof onResults === 'function') {
        onResults({ domain: d, result: payload });
      }
    } catch (err) {
      console.error('Search failed', err);
      setError(err.message || 'Search failed');
    } finally {
      setQuerying(false);
    }
  }, [onResults]);

  const handleSubmit = (value) => {
    const cleaned = (value || '').trim();
    if (!cleaned) return;
    setDomain(cleaned);
    performSearch(cleaned);
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(domain); }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Enter a company website (example: coca-cola.com)" style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #e6edf3' }} />
            <button type="submit" style={{ padding: '12px 16px', borderRadius: 8, background: '#2563eb', color: 'white', border: 'none' }}>{querying ? 'Searching…' : 'Search'}</button>
          </div>
        </form>

        <div style={{ marginTop: 18 }}>
          <ClientOnly>
            <SearchResults domain={domain} result={result} loading={querying} />
          </ClientOnly>
        </div>
      </div>
    </div>
  );
}
