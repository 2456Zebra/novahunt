import React, { useState, useRef, useEffect } from 'react';

/**
 * SearchClient
 *
 * Usage: <SearchClient />
 *
 * Notes:
 * - Issues a GET to /api/find-emails?domain=<domain>
 * - Works for unauthenticated users (shows results or errors).
 * - Logs raw response for debugging: console.log('find-emails response (raw):', body)
 */

export default function SearchClient() {
  const [domain, setDomain] = useState('');
  const [submittedDomain, setSubmittedDomain] = useState('');
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // autofocus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
    return () => {
      // cleanup any inflight request
      if (abortRef.current) {
        try { abortRef.current.abort(); } catch (e) {}
      }
    };
  }, []);

  function normalizeDomain(input) {
    if (!input) return '';
    // remove protocol + whitespace
    let d = input.trim().toLowerCase();
    d = d.replace(/^https?:\/\//, '').replace(/^www\./, '');
    // keep only host part
    const parts = d.split('/');
    return parts[0];
  }

  async function doSearch(nextDomain) {
    const normalized = normalizeDomain(nextDomain);
    if (!normalized) {
      setError('Please enter a valid domain (example: coca-cola.com)');
      setItems([]);
      setTotal(null);
      return;
    }

    // cancel previous
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch (e) {}
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError('');
    setItems([]);
    setTotal(null);

    try {
      const url = `/api/find-emails?domain=${encodeURIComponent(normalized)}`;
      const res = await fetch(url, { signal: controller.signal, method: 'GET' });
      const text = await res.text();
      let body;
      try { body = text ? JSON.parse(text) : {}; } catch (e) { body = { raw: text }; }

      // Debug logging for quick inspection in browser console
      console.log('find-emails response (raw):', body);

      if (!res.ok) {
        // try to extract server-provided error
        const errMsg = (body && body.error) ? body.error : `Server returned ${res.status}`;
        throw new Error(errMsg);
      }

      if (!body || !body.ok) {
        const errMsg = (body && body.error) ? body.error : 'Unexpected response from server';
        throw new Error(errMsg);
      }

      // Accept body.items and body.total; be defensive if missing
      const returnedItems = Array.isArray(body.items) ? body.items : [];
      const returnedTotal = (typeof body.total === 'number') ? body.total : (returnedItems.length || 0);

      setItems(returnedItems);
      setTotal(returnedTotal);
      setSubmittedDomain(normalized);
    } catch (err) {
      if (err.name === 'AbortError') {
        // ignore aborted requests
        return;
      }
      console.error('SearchClient error', err);
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    setError('');
    doSearch(domain);
  }

  function onQuickExample(d) {
    setDomain(d);
    doSearch(d);
  }

  return (
    <section aria-label="Domain search" style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
      <form onSubmit={onSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <label htmlFor="domain-input" style={{ display: 'none' }}>Company domain</label>
        <input
          id="domain-input"
          ref={inputRef}
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="Enter a website domain (example: coca-cola.com)"
          aria-label="Enter a website domain"
          style={{ flex: 1, padding: '10px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 16 }}
        />
        <button
          type="submit"
          disabled={loading}
          aria-disabled={loading}
          style={{
            padding: '10px 14px',
            borderRadius: 6,
            background: loading ? '#9ca3af' : '#0ea5a4',
            color: '#fff',
            border: 'none',
            cursor: loading ? 'default' : 'pointer'
          }}
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      <div style={{ marginBottom: 12, color: '#6b7280' }}>
        Quick examples:&nbsp;
        <button onClick={() => onQuickExample('coca-cola.com')} style={{ marginRight: 8, border: 0, background: 'transparent', color: '#0ea5a4', cursor: 'pointer' }}>coca-cola.com</button>
        <button onClick={() => onQuickExample('santamonica.gov')} style={{ border: 0, background: 'transparent', color: '#0ea5a4', cursor: 'pointer' }}>santamonica.gov</button>
      </div>

      {error && (
        <div role="alert" style={{ marginBottom: 12, color: '#b91c1c', background: '#fee2e2', padding: 12, borderRadius: 6 }}>
          {error}
        </div>
      )}

      {submittedDomain && (
        <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
          {/* Left column: Search Results */}
          <div style={{ flex: '0 0 60%' }}>
            <div style={{ marginBottom: 16, color: '#374151', display: 'flex', alignItems: 'center', gap: 12 }}>
              <button 
                style={{ 
                  padding: '6px 12px', 
                  fontSize: 14,
                  borderRadius: 6, 
                  background: '#0ea5a4', 
                  color: '#fff', 
                  border: 'none',
                  cursor: 'pointer'
                }}
                onClick={() => {/* Results action if needed */}}
              >
                Results
              </button>
              <span style={{ fontSize: 14, color: '#6b7280' }}>
                for <strong>{submittedDomain}</strong> {total !== null && <span>— {items.length} of {total}</span>}
              </span>
            </div>

            {items.length === 0 && !loading && !error && (
              <div style={{ color: '#6b7280', padding: 16, borderRadius: 6, border: '1px dashed #e5e7eb' }}>
                No results returned. If you expected more results, please sign in to reveal more or try again later.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.map((it, idx) => (
                <article key={it.email || `${idx}`} style={{ padding: 12, border: '1px solid #e6e7ea', borderRadius: 8, background: '#fff' }}>
                  <div style={{ fontWeight: 700 }}>{it.name || it.email}</div>
                  <div style={{ color: '#6b7280', marginTop: 6 }}>{it.title || ''}</div>
                  <div style={{ marginTop: 8 }}>
                    <a href={`mailto:${it.email}`} style={{ color: '#0ea5a4', textDecoration: 'none' }} aria-label={`Email ${it.email}`}>
                      {it.email}
                    </a>
                  </div>
                  <div style={{ marginTop: 8, color: '#9ca3af', fontSize: 13 }}>
                    Confidence: {it.confidence ? String(Math.round(it.confidence * 100)) + '%' : 'n/a'}
                  </div>
                  {it.source && (
                    <div style={{ marginTop: 8 }}>
                      <a href={it.source} target="_blank" rel="noopener noreferrer" style={{ color: '#0ea5a4', fontSize: 13 }}>
                        Source
                      </a>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>

          {/* Right column: Company Profile */}
          <div style={{ flex: '0 0 35%' }}>
            <div style={{ position: 'sticky', top: 20, padding: 20, border: '1px solid #e6e7ea', borderRadius: 8, background: '#fff' }}>
              <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18, fontWeight: 700 }}>Company Profile</h3>
              
              {/* Company Logo Placeholder */}
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <div style={{ width: 80, height: 80, background: '#0ea5a4', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 700 }}>
                  {submittedDomain.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Company Name */}
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>
                  {submittedDomain.split('.')[0].charAt(0).toUpperCase() + submittedDomain.split('.')[0].slice(1)}
                </h4>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{submittedDomain}</div>
              </div>

              {/* Company Details */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>About</div>
                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>
                  Company information and profile details for {submittedDomain}. This section provides an overview of the organization&apos;s business operations and contact information.
                </p>
              </div>

              {/* Industry & Stats */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Details</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#6b7280' }}>Contacts Found:</span>
                    <span style={{ color: '#111827', fontWeight: 600 }}>{items.length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#6b7280' }}>Domain:</span>
                    <span style={{ color: '#111827', fontWeight: 600 }}>{submittedDomain}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#6b7280' }}>Total Available:</span>
                    <span style={{ color: '#111827', fontWeight: 600 }}>{total || items.length}</span>
                  </div>
                </div>
              </div>

              {/* Visit Website */}
              <div style={{ marginTop: 20 }}>
                <a 
                  href={`https://${submittedDomain}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    display: 'block',
                    textAlign: 'center',
                    padding: '10px 16px', 
                    background: '#f3f4f6', 
                    color: '#374151', 
                    borderRadius: 6, 
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                    border: '1px solid #e5e7eb'
                  }}
                >
                  Visit Website →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show this when no search has been performed */}
      {!submittedDomain && !loading && (
        <div style={{ marginTop: 20, textAlign: 'center', color: '#6b7280', padding: 40, border: '1px dashed #e5e7eb', borderRadius: 8 }}>
          Enter a domain above to search for business contacts
        </div>
      )}
    </section>
  );
}
