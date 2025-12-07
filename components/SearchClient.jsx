import React, { useCallback, useEffect, useRef, useState } from 'react';
import ClientOnly from './ClientOnly';
import RightPanel from './RightPanel';

/**
 * SearchClient
 *
 * - Controlled input (no pills)
 * - performSearch only increments usage on a successful response
 * - emits usage-updated for Header to refresh counters
 * - dispatches nh_inline_reveal events with domain + contact data (Legacy kept) but also supports direct inline reveal via dispatch
 */

export default function SearchClient({ onResults }) {
  const SAMPLE_DOMAINS = ['coca-cola.com', 'fordmodels.com', 'unitedtalent.com', 'wilhelmina.com', 'nfl.com'];

  const [value, setValue] = useState('');
  const [querying, setQuerying] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const mountedRef = useRef(true);
  const lastSearchRef = useRef(null); // to avoid double increments

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  // If ?domain= exists when component mounts, auto-run a search
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const p = new URLSearchParams(window.location.search);
      const q = p.get('domain');
      if (q) {
        const normalized = q.trim();
        setValue(normalized);
        // run search in next tick so UI updates
        setTimeout(() => performSearch(normalized), 0);
      }
    } catch (e) {
      // ignore in SSR
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Small helper: do the fetch with timeout
  async function fetchWithTimeout(url, opts = {}, timeout = 10000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { ...opts, signal: controller.signal, credentials: 'same-origin' });
      return res;
    } finally {
      clearTimeout(id);
    }
  }

  const performSearch = useCallback(async (domain) => {
    if (!domain) return;
    // avoid duplicate concurrent searches for same domain
    if (querying && lastSearchRef.current === domain) return;

    setQuerying(true);
    setError(null);
    setResult(null);

    try {
      const url = `/api/find-company?domain=${encodeURIComponent(domain)}`;
      const res = await fetchWithTimeout(url, {}, 12000);
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Search API error ${res.status}: ${txt}`);
      }

      const payload = await res.json();

      // normalize company shape
      const company = payload.company || payload || {};
      company.contacts = (payload.contacts || company.contacts || []).map(c => ({ ...c, _revealed: !!c.email, _saved: false }));
      company.total = payload.total || (company.contacts && company.contacts.length) || 0;
      company.shown = payload.shown || (company.contacts && company.contacts.length) || 0;

      // update local state only if still mounted
      if (!mountedRef.current) return;
      setResult({ company });
      lastSearchRef.current = domain;

      // Emit results only after success
      if (typeof onResults === 'function') {
        try { onResults({ domain, result: { company } }); } catch (e) {}
      }

      // Notify header / global UI to refresh usage immediately
      try {
        window.dispatchEvent(new CustomEvent('usage-updated'));
      } catch (e) {}

    } catch (err) {
      if (!mountedRef.current) return;
      console.error('Search error', err);
      setError(err.message || 'Search failed');
    } finally {
      if (mountedRef.current) setQuerying(false);
    }
  }, [onResults, querying]);

  // user submitted the form or clicked Search
  const onSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleaned = (value || '').trim();
    if (!cleaned) return;
    await performSearch(cleaned);
  };

  // sample click: set value and run search, prevent default navigation
  const onSampleClick = (domain, e) => {
    if (e && e.preventDefault) e.preventDefault();
    setValue(domain);
    setTimeout(() => performSearch(domain), 0);
  };

  // Inline reveal: dispatch event with domain + contact info (legacy) so GlobalRevealInterceptor can handle,
  // but also callers can listen for this event or the parent SearchClient UI can be extended to reveal in-place.
  function dispatchInlineReveal(domain, idx, contact) {
    try {
      window.dispatchEvent(new CustomEvent('nh_inline_reveal', { detail: { domain, idx, contact } }));
    } catch (err) {
      console.warn('dispatchInlineReveal failed', err);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <form onSubmit={onSubmit}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              aria-label="domain"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter domain (example: coca-cola.com)"
              style={{
                flex: 1,
                padding: '12px 14px',
                fontSize: 16,
                borderRadius: 8,
                border: '1px solid #e6edf3',
                background: '#fff',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <button type="submit" disabled={querying} style={{
              padding: '12px 16px',
              borderRadius: 8,
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer'
            }}>
              {querying ? 'Searching…' : 'Search'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: 12, color: '#6b7280', fontSize: 13 }}>
          Try a sample domain:
          <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {SAMPLE_DOMAINS.map(d => (
              <a
                key={d}
                href={`/?domain=${encodeURIComponent(d)}`}
                onClick={(e) => onSampleClick(d, e)}
                style={{ color: '#2563eb', textDecoration: 'underline', fontSize: 13 }}
              >
                {d}
              </a>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <ClientOnly fallback={<div style={{ minHeight: 260 }} />}>
            {querying && !result && <div style={{ padding: 18, color: '#6b7280' }}>Searching…</div>}
            {error && <div style={{ padding: 18, color: '#dc2626' }}>{error}</div>}
            {!querying && !error && result && (
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ padding: 12 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {result.company && result.company.logo ? (
                        <img src={result.company.logo} alt={`${result.company.name || result.company.domain} logo`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      ) : (
                        <div style={{ color: '#6b7280', fontWeight: 700 }}>{(result.company && (result.company.name || result.company.domain) || 'N')[0]}</div>
                      )}
                    </div>

                    <div>
                      <div style={{ fontWeight: 700 }}>{result.company && (result.company.name || result.company.domain)}</div>
                      <div style={{ color: '#6b7280', fontSize: 13 }}>{result.company && result.company.domain}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 18 }}>
                  <div>
                    {(result.company.contacts && result.company.contacts.length) ? result.company.contacts.map((c, i) => (
                      <div key={i} style={{ background: '#fff', border: '1px solid #e6edf3', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                          <div>
                            <div style={{ fontWeight: 700 }}>{c.first_name} {c.last_name}</div>
                            <div style={{ color: '#6b7280', fontSize: 13 }}>{c._revealed ? (c.email || '') : (c.email ? c.email.replace(/(.{2})(.*)(@.*)/, (m, a, b, d) => `${a}***${d}`) : '')}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <a onClick={() => { const q = encodeURIComponent(`${c.first_name} ${c.last_name} ${result.company.domain} site:linkedin.com`); window.open('https://www.google.com/search?q=' + q, '_blank'); }} style={{ fontSize: 12, color: '#6b7280' }}>source</a>
                            <button onClick={() => {
                              // dispatch inline reveal (domain + idx + contact info) handled by GlobalRevealInterceptor
                              dispatchInlineReveal(result.company.domain || value, i, c);
                            }} style={{ padding: '6px 8px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' }}>Reveal</button>
                          </div>
                        </div>
                      </div>
                    )) : <div style={{ color: '#6b7280' }}>No contacts found.</div>}
                  </div>

                  <div>
                    <RightPanel domain={value} company={result.company} />
                  </div>
                </div>
              </div>
            )}
          </ClientOnly>
        </div>
      </div>
    </div>
  );
}
