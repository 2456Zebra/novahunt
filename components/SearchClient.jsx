import React, { useCallback, useEffect, useRef, useState } from 'react';
import RightPanel from './RightPanel';
import ClientOnly from './ClientOnly';

/**
 * SearchClient
 *
 * Replaces the older SearchInputPreview-based implementation with a straightforward,
 * controlled input so the value is shown plainly (no "boxed" pill). Handles:
 *  - reading ?domain= from location and auto-running a search
 *  - controlled input (no extra DOM inside the <input>)
 *  - sample domain links (styled blue)
 *  - basic results rendering and sending the company -> RightPanel
 *
 * NOTE: This component intentionally renders the input directly instead of using
 * any wrapper that might produce chips or pills.
 */

export default function SearchClient() {
  const SAMPLE_DOMAINS = ['coca-cola.com', 'fordmodels.com', 'unitedtalent.com', 'wilhelmina.com', 'nfl.com'];

  const [value, setValue] = useState('');
  const [querying, setQuerying] = useState(false);
  const [result, setResult] = useState(null); // expected { company?, contacts?, total?, shown? }
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // On mount: read ?domain param and prefill the input and auto-run
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const q = params.get('domain');
      if (q) {
        const normalized = q.trim();
        setValue(normalized);
        // run search after next tick so input reflects the value first
        setTimeout(() => performSearch(normalized), 0);
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const performSearch = useCallback(async (domain) => {
    if (!domain) return;
    setQuerying(true);
    setError(null);
    setResult(null);

    try {
      const url = `/api/find-company?domain=${encodeURIComponent(domain)}`;
      const res = await fetch(url);
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Search API error ${res.status}: ${txt}`);
      }
      const payload = await res.json();

      // normalise shape: ensure company and contacts arrays exist
      const company = payload.company || {};
      company.contacts = (payload.contacts || company.contacts || []).map(c => ({ ...c, _revealed: false, _saved: false }));
      company.total = payload.total || company.contacts.length || 0;
      company.shown = payload.shown || company.contacts.length || 0;

      if (!mountedRef.current) return;
      setResult({ company, contacts: company.contacts || [], total: company.total || 0, shown: company.shown || 0 });
      // update URL (non-destructive)
      try {
        const u = new URL(window.location.href);
        u.searchParams.set('domain', domain);
        window.history.replaceState({}, '', u.toString());
      } catch (e) {}
    } catch (err) {
      console.error('Search failed', err);
      if (!mountedRef.current) return;
      setError(err.message || 'Search failed');
    } finally {
      if (mountedRef.current) setQuerying(false);
    }
  }, []);

  const onSubmit = async (e) => {
    e && e.preventDefault();
    const cleaned = (value || '').trim();
    if (!cleaned) return;
    await performSearch(cleaned);
  };

  // Click a sample domain: set input and run search (no pill creation)
  const onSampleClick = (d, e) => {
    e && e.preventDefault();
    setValue(d);
    setTimeout(() => performSearch(d), 0);
  };

  // Minimal results UI so you can test search quickly.
  function ResultsView() {
    if (querying) return <div style={{ padding: 18, color: '#6b7280' }}>Searching…</div>;
    if (error) return <div style={{ padding: 18, color: '#dc2626' }}>{error}</div>;
    if (!result) return <div style={{ padding: 18, color: '#6b7280' }}>Enter a domain and press Search to see results.</div>;

    const { company, contacts } = result;
    return (
      <div>
        <div style={{ marginBottom: 12, padding: 12, background: '#fff', border: '1px solid #e6edf3', borderRadius: 8 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {company && company.logo ? <img src={company.logo} alt="logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <div style={{ color: '#6b7280', fontWeight: 700 }}>{(company && (company.name || company.domain) || 'N')[0]}</div>}
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>{company && (company.name || company.domain)}</div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>{company && company.domain}</div>
            </div>
          </div>
          <div style={{ marginTop: 10, color: '#374151' }}>{company && (company.description || (company.enrichment && company.enrichment.description))}</div>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {(contacts && contacts.length) ? contacts.map((c, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e6edf3', borderRadius: 8, padding: 12, display: 'grid', gridTemplateColumns: '1fr 160px', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{c.first_name} {c.last_name}</div>
                <div style={{ color: '#6b7280', fontSize: 13 }}>{c._revealed ? (c.email || '') : maskEmail(c.email)}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={() => {
                  // If reveal flow: try to call /api/reveal; but keep client-side fallback in the Home page flow.
                  // Here we bubble using custom event so parent can handle if needed.
                  const ev = new CustomEvent('nh_reveal_requested', { detail: { target: c.email || `${i}` } });
                  window.dispatchEvent(ev);
                }} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' }}>Reveal</button>
              </div>
            </div>
          )) : <div style={{ padding: 12, color: '#6b7280' }}>No contacts found.</div>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <form onSubmit={onSubmit}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* Plain controlled input - no extra DOM children inside the input */}
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
          Want to take us for a test drive? Click a sample domain:
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
            <ResultsView />
          </ClientOnly>
        </div>
      </div>
    </div>
  );
}

/* helper re-used from index */
function maskEmail(email){
  if(!email) return '';
  const [local, dom] = (email || '').split('@');
  if(!local || !dom) return email;
  if(local.length <= 2) return '•'.repeat(local.length) + '@' + dom;
  const visible = Math.max(1, Math.floor(local.length * 0.25));
  return local.slice(0,visible) + '••••' + '@' + dom;
}
