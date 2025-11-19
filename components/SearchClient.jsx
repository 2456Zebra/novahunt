'use client';

import { useEffect, useState } from 'react';
import RevealButton from './RevealButton';
import { SignInHintIfAnonymous } from './SearchClient'; // keep existing named export if present
// If the above import causes circular issues (because file previously exported the helper), import from './SearchClientHelper' instead.
// If you don't have a separate helper, below we include an inline fallback for the hint.

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

export default function SearchClient() {
  const [domain, setDomain] = useState('');
  const [mode, setMode] = useState('emails'); // emails | import | ai
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    // show demo data for a default domain on mount
    const demo = 'coca-cola.com';
    setDomain(demo);
    // optionally fetch demo results or leave blank
    const samples = sampleLeadsFor(demo, 'emails');
    setResults(samples);
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
      if (mode === 'import') {
        // import mode uses local placeholder
        setResults(sampleLeadsFor(q, 'import'));
      } else if (mode === 'ai') {
        // AI demo mode - sample data
        setResults(sampleLeadsFor(q, 'ai'));
      } else {
        // call server API for email hunting
        const res = await fetch(`/api/find-emails?domain=${encodeURIComponent(q)}`);
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          setError(body || `Search failed: ${res.status}`);
          setLoading(false);
          return;
        }
        const json = await res.json();
        // ensure items have revealed:false initially
        const items = Array.isArray(json) ? json.map(it => ({ ...it, revealed: false })) : (json.items || []);
        setResults(items);
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

  return (
    <div style={{ padding: '2rem', maxWidth: 980, margin: '0 auto' }}>
      <h2 style={{ marginTop: 0 }}>Find Business Emails</h2>
      <p style={{ color: '#374151' }}>
        Confidence scores <strong>85%–100%</strong>.
      </p>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={mode} onChange={e => setMode(e.target.value)} style={{ padding: '.5rem', border: '1px solid #ddd', borderRadius: 6 }}>
          <option value="emails">Hunt Emails</option>
          <option value="import">Hunt Import Records</option>
          <option value="ai">Hunt AI Leads</option>
        </select>

        <input
          value={domain}
          onChange={e => setDomain(e.target.value)}
          placeholder="e.g. fordmodels.com"
          style={{ padding: '.5rem', border: '1px solid #ddd', borderRadius: 6, minWidth: 280, flex: '1 1 360px' }}
        />

        <button type="submit" disabled={loading} style={{ padding: '.5rem 1rem', borderRadius: 8, background: '#007bff', color: '#fff', border: 'none' }}>
          {loading ? 'Searching…' : mode === 'ai' ? 'Hunt AI Leads' : 'Hunt Emails'}
        </button>
      </form>

      {error && <div style={{ color: 'crimson', marginTop: 12 }}>{error}</div>}

      {/* Inline hint for anonymous users */}
      <SignInHintInline />

      <div style={{ marginTop: 16 }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {results.slice(0, showAll ? results.length : 3).map((r, idx) => (
            <li key={r.email + '-' + idx} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#111' }}>{r.revealed ? (r.email || '(no email)') : maskEmail(r.email || '(no email)')}</div>
                <div style={{ color: '#666', fontSize: 13 }}>{(r.name || '—') + (r.title ? ' • ' + r.title : '')}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600, color: '#007bff' }}>{Math.round((r.confidence || 0) * 100)}%</div>
                <div style={{ marginTop: 8 }}>
                  <RevealButton
                    contactId={r.email || `idx-${idx}`}
                    payload={r}
                    onRevealed={(revealed) => onRevealedFor(idx, revealed)}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>

        {results.length > 3 && !showAll && (
          <div style={{ marginTop: 10 }}>
            <button onClick={() => {
              const session = typeof window !== 'undefined' ? localStorage.getItem('nh_session') : null;
              if (session) {
                setShowAll(true);
              } else {
                // prompt sign in
                try { window.dispatchEvent(new CustomEvent('open-signin-modal')); } catch (e) {}
              }
            }} style={{ padding: '.5rem .75rem', borderRadius: 6, background: '#007bff', color: '#fff', border: 'none' }}>
              {localStorage.getItem && localStorage.getItem('nh_session') ? `Show ${results.length - 3} more` : 'Upgrade to see more results'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// helpers
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
      { email: `sara.marketing@${base}`, name: 'Sara Marketing', title: 'Growth Marketer', confidence: 0.94 },
      { email: `tom.lead@${base}`, name: 'Tom Lead', title: 'Head of Demand Gen', confidence: 0.89 },
      { email: `ops@${base}`, name: '', title: 'Operations', confidence: 0.82 },
      { email: `partnerships@${base}`, name: '', title: 'Partnerships', confidence: 0.70 },
      { email: `bizdev@${base}`, name: '', title: 'Business Development', confidence: 0.65 }
    ];
  } else if (mode === 'import') {
    return [
      { email: `imported.user1@${base}`, name: 'Imported User 1', title: 'Marketing Manager', confidence: 0.78 },
      { email: `imported.user2@${base}`, name: 'Imported User 2', title: 'Sales Lead', confidence: 0.72 },
      { email: `imported.user3@${base}`, name: 'Imported User 3', title: 'Director', confidence: 0.68 }
    ];
  }

  return [
    { email: `john.doe@${base}`, name: 'John Doe', title: 'Head of Marketing', confidence: 0.92 },
    { email: `jane.smith@${base}`, name: 'Jane Smith', title: 'VP Sales', confidence: 0.87 },
    { email: `marketing@${base}`, name: '', title: '', confidence: 0.80 },
    { email: `press@${base}`, name: '', title: '', confidence: 0.66 },
    { email: `info@${base}`, name: '', title: '', confidence: 0.55 },
  ];
}
