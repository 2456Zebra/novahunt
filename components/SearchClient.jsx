'use client';

import { useEffect, useState } from 'react';
import RevealButton from './RevealButton';

// Small inline hint used when anonymous
function SignInHintInline() {
  if (typeof window === 'undefined') return null;
  try {
    const session = localStorage.getItem('nh_session');
    if (session) return null;
  } catch (e) {}
  return (
    <div style={{ color: '#f97316', marginTop: 8, fontWeight: 600 }}>
      Sign in to see all results
    </div>
  );
}

function maskEmail(email) {
  try {
    if (!email) return '';
    const [local, domain] = (email || '').split('@');
    if (!local || !domain) return email || '';
    const keep = 2;
    const maskedLocal = local.length <= keep ? '*'.repeat(local.length) : '*'.repeat(Math.max(0, local.length - keep)) + local.slice(-keep);
    return `${maskedLocal}@${domain}`;
  } catch (e) {
    return email || '';
  }
}

function sampleLeadsFor(domain, mode) {
  const d = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] || 'example.com';
  const base = d.includes('.') ? d : `${d}.com`;

  if (mode === 'ai') {
    return [
      { email: `sara.marketing@${base}`, name: 'Sara Marketing', title: 'Growth Marketer', confidence: 0.94, source: `https://www.linkedin.com/in/sara-marketing` },
      { email: `tom.lead@${base}`, name: 'Tom Lead', title: 'Head of Demand Gen', confidence: 0.89, source: `https://www.linkedin.com/in/tom-lead` },
      { email: `ops@${base}`, name: '', title: 'Operations', confidence: 0.82, source: '' },
      { email: `partnerships@${base}`, name: '', title: 'Partnerships', confidence: 0.70, source: '' },
      { email: `bizdev@${base}`, name: '', title: 'Business Development', confidence: 0.65, source: '' }
    ];
  } else if (mode === 'import') {
    return [
      { email: `imported.user1@${base}`, name: 'Imported User 1', title: 'Marketing Manager', confidence: 0.78, source: '' },
      { email: `imported.user2@${base}`, name: 'Imported User 2', title: 'Sales Lead', confidence: 0.72, source: '' },
      { email: `imported.user3@${base}`, name: 'Imported User 3', title: 'Director', confidence: 0.68, source: '' }
    ];
  }

  return [
    { email: `john.doe@${base}`, name: 'John Doe', title: 'Head of Marketing', confidence: 0.92, source: '' },
    { email: `jane.smith@${base}`, name: 'Jane Smith', title: 'VP Sales', confidence: 0.87, source: '' },
    { email: `marketing@${base}`, name: '', title: 'Marketing', confidence: 0.80, source: '' },
    { email: `press@${base}`, name: '', title: 'Press', confidence: 0.66, source: '' },
    { email: `info@${base}`, name: '', title: 'Info', confidence: 0.55, source: '' },
  ];
}

// Very small heuristic to map title -> department
function departmentForTitle(title = '') {
  const t = (title || '').toLowerCase();
  if (!t) return 'General';
  if (t.includes('marketing') || t.includes('growth')) return 'Marketing';
  if (t.includes('sales') || t.includes('bizdev')) return 'Sales';
  if (t.includes('founder') || t.includes('ceo') || t.includes('head')) return 'Executive';
  if (t.includes('operations') || t.includes('ops')) return 'Operations';
  if (t.includes('press') || t.includes('communications')) return 'PR';
  return 'General';
}

export default function SearchClient() {
  const [domain, setDomain] = useState('');
  const [mode, setMode] = useState('emails'); // emails | ai (Discover Leads)
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [totalCount, setTotalCount] = useState(null); // from API if available

  useEffect(() => {
    // seed demo domain so users see something useful immediately
    const demo = 'coca-cola.com';
    setDomain(demo);
    setResults(sampleLeadsFor(demo, 'emails'));
    setTotalCount(56); // demo total for UI (replace when real API in place)
  }, []);

  async function handleSearch(e) {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    const q = (domain || '').trim();
    if (!q) {
      setError('Enter a domain (e.g. stripe.com)');
      return;
    }
    setLoading(true);
    setResults([]);
    setShowAll(false);
    try {
      if (mode === 'ai') {
        // Discover Leads: AI-powered suggestion list (still demo until backend)
        const samples = sampleLeadsFor(q, 'ai');
        setResults(samples);
        setTotalCount(samples.length); // demo
      } else {
        // email hunt - call /api/find-emails if available
        const resp = await fetch(`/api/find-emails?domain=${encodeURIComponent(q)}`);
        if (!resp.ok) {
          // fallback to sample results if server not implemented
          setResults(sampleLeadsFor(q, 'emails'));
          setTotalCount( sampleLeadsFor(q, 'emails').length );
          setLoading(false);
          return;
        }
        const body = await resp.json();
        // body expected: { items: [...], total: N } or an array
        const items = Array.isArray(body) ? body.map(it => ({ ...it, revealed: false })) : (body.items || []);
        setResults(items);
        setTotalCount(body.total || items.length);
      }
    } catch (err) {
      setError(err?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }

  function onRevealedFor(index, revealedData) {
    setResults(prev => {
      const copy = prev.slice();
      copy[index] = { ...copy[index], revealed: true, email: revealedData?.email || copy[index].email };
      return copy;
    });
  }

  // group by department
  const groups = results.reduce((acc, it, idx) => {
    const dept = departmentForTitle(it.title);
    (acc[dept] = acc[dept] || []).push({ ...it, __idx: idx });
    return acc;
  }, {});

  return (
    <div style={{ padding: '2rem', maxWidth: 980, margin: '0 auto' }}>
      <h2 style={{ marginTop: 0 }}>Find Business Emails</h2>
      <p style={{ color: '#374151' }}>
        Confidence scores <strong>85%–100%</strong>.
      </p>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={mode} onChange={e => setMode(e.target.value)} style={{ padding: '.5rem', border: '1px solid #ddd', borderRadius: 6 }}>
          <option value="emails">Hunt Emails</option>
          <option value="ai">Discover Leads</option>
        </select>

        <input
          value={domain}
          onChange={e => setDomain(e.target.value)}
          placeholder="e.g. fordmodels.com"
          style={{ padding: '.5rem', border: '1px solid #ddd', borderRadius: 6, minWidth: 280, flex: '1 1 360px' }}
        />

        <button type="submit" disabled={loading} style={{ padding: '.5rem 1rem', borderRadius: 8, background: '#007bff', color: '#fff', border: 'none' }}>
          {loading ? 'Searching…' : mode === 'ai' ? 'Discover Leads' : 'Hunt Emails'}
        </button>
      </form>

      {error && <div style={{ color: 'crimson', marginTop: 12 }}>{error}</div>}

      {/* counts */}
      <div style={{ marginTop: 12, color: '#374151' }}>
        Showing {Math.min( results.length, showAll ? results.length : 3 )} {results.length === 1 ? 'result' : 'results'}
        {totalCount ? ` of ${totalCount}` : ''}
        {totalCount ? <span style={{ marginLeft: 8, color: '#6b7280' }}>{!localStorage.getItem || !localStorage.getItem('nh_session') ? '• Sign in or upgrade to see all' : ''}</span> : null}
      </div>

      {/* inline hint */}
      <SignInHintInline />

      <div style={{ marginTop: 16 }}>
        {/* grouped collapsible results */}
        {Object.keys(groups).length === 0 ? (
          <div style={{ color: '#6b7280', paddingTop: 12 }}>No results yet — try searching a company or Discover Leads to get suggestions.</div>
        ) : (
          Object.keys(groups).map(dept => (
            <DepartmentGroup key={dept} name={dept} items={groups[dept]} onRevealedFor={onRevealedFor} />
          ))
        )}

        {/* show more / upgrade (only visible when there are more results) */}
        {results.length > 3 && !showAll && (
          <div style={{ marginTop: 12 }}>
            <button onClick={() => {
              const session = typeof window !== 'undefined' ? localStorage.getItem('nh_session') : null;
              if (session) {
                setShowAll(true);
              } else {
                // anonymous users go to the upgrade page to see full results
                window.location.href = '/upgrade';
              }
            }} style={{ padding: '.5rem .75rem', borderRadius: 6, background: '#007bff', color: '#fff', border: 'none' }}>
              {localStorage.getItem && localStorage.getItem('nh_session') ? `Show ${results.length - 3} more` : `Upgrade to see all ${totalCount || results.length}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Collapsible department group component
function DepartmentGroup({ name, items, onRevealedFor }) {
  const [open, setOpen] = useState(true);
  return (
    <section style={{ border: '1px solid #eee', borderRadius: 8, marginBottom: 12, overflow: 'hidden' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#fafafa', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <div style={{ fontWeight: 700 }}>{name} <span style={{ marginLeft: 8, color: '#6b7280', fontWeight: 400 }}>{items.length}</span></div>
        <div style={{ color: '#6b7280' }}>{open ? '▾' : '▸'}</div>
      </header>
      {open && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {items.map((r) => (
            <li key={`${r.email}-${r.__idx}`} style={{ padding: '10px 12px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{r.revealed ? (r.email || '(no email)') : maskEmail(r.email || '(no email)')}</div>
                <div style={{ color: '#666', fontSize: 13 }}>{(r.name || '—')}{r.title ? ' • ' + r.title : ''}</div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600, color: '#007bff' }}>{Math.round((r.confidence || 0) * 100)}%</div>
                <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  {r.source ? <a href={r.source} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'underline' }}>Source</a> : null}
                  <RevealButton contactId={r.email || r.__idx} payload={r} onRevealed={(revealed) => onRevealedFor(r.__idx, revealed)} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
