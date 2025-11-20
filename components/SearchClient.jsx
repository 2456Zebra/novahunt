'use client';

import { useEffect, useState } from 'react';
import RevealButton from './RevealButton';

/**
 * SearchClient — Hunt Emails only.
 * - All Discover/AI UI removed to avoid LLM usage/costs.
 * - Keeps Hunter-backed domain search via /api/find-emails.
 */

function SignInHintInline() {
  if (typeof window === 'undefined') return null;
  try {
    const session = localStorage.getItem('nh_session');
    if (session) return null;
  } catch (e) {}
  return (
    <div style={{ color: '#f97316', marginTop: 8, fontWeight: 600 }}>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          try {
            window.dispatchEvent(new CustomEvent('open-signin-modal'));
          } catch (err) {}
        }}
        style={{ color: '#f97316', textDecoration: 'underline' }}
      >
        Sign in to see all results
      </a>
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

function sampleLeadsFor(domain) {
  const d = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] || 'example.com';
  const base = d.includes('.') ? d : `${d}.com`;
  return [
    { email: `john.doe@${base}`, name: 'John Doe', title: 'Head of Marketing', confidence: 0.92, source: '' },
    { email: `jane.smith@${base}`, name: 'Jane Smith', title: 'VP Sales', confidence: 0.87, source: '' },
    { email: `marketing@${base}`, name: '', title: 'Marketing', confidence: 0.80, source: '' },
    { email: `press@${base}`, name: '', title: 'Press', confidence: 0.66, source: '' },
    { email: `info@${base}`, name: '', title: 'Info', confidence: 0.55, source: '' },
  ];
}

export default function SearchClient() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [totalCount, setTotalCount] = useState(null);

  // Remove demo prefill — start with empty input
  useEffect(() => {
    // Intentionally left blank so the input starts empty on load
  }, []);

  function persistServerUsage(usage) {
    try {
      if (!usage) return;
      localStorage.setItem('nh_usage', JSON.stringify(usage));
      window.dispatchEvent(new CustomEvent('account-usage-updated'));
    } catch (e) {}
  }

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
    setTotalCount(null);
    try {
      // Call Hunter-backed endpoint (demo or real depending on HUNTER_API_KEY)
      const resp = await fetch(`/api/find-emails?domain=${encodeURIComponent(q)}`);
      if (!resp.ok) {
        // fallback to sample results
        const fallback = sampleLeadsFor(q);
        setResults(fallback);
        setTotalCount(fallback.length);
        setLoading(false);
        return;
      }
      const body = await resp.json();
      const items = Array.isArray(body.items) ? body.items.map(it => ({ ...it, revealed: false })) : (body.items || []);
      setResults(items);
      setTotalCount(typeof body.total === 'number' ? body.total : items.length);
      if (body.usage) persistServerUsage(body.usage);
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

  function openSigninModal() {
    try {
      window.dispatchEvent(new CustomEvent('open-signin-modal'));
    } catch (e) {
      // ignore
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 980, margin: '0 auto' }}>
      <h2 style={{ marginTop: 0 }}>Find Business Emails</h2>
      <p style={{ color: '#374151' }}>
        Confidence scores <strong>0–100%</strong>.
      </p>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: 760, marginBottom: 8 }}>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>
            Enter a domain like <code>example.com</code> (no https:// or www)
          </div>
          <input
            value={domain}
            onChange={e => setDomain(e.target.value)}
            placeholder="e.g. fordmodels.com"
            style={{ padding: '.5rem', border: '1px solid #ddd', borderRadius: 6, minWidth: 280, width: '100%' }}
          />
        </div>

        <button type="submit" disabled={loading} style={{ padding: '.5rem 1rem', borderRadius: 8, background: '#007bff', color: '#fff', border: 'none' }}>
          {loading ? 'Searching…' : 'Hunt Emails'}
        </button>
      </form>

      {error && <div style={{ color: 'crimson', marginTop: 12 }}>{error}</div>}

      <div style={{ marginTop: 12, color: '#374151' }}>
        Showing {Math.min(results.length, showAll ? results.length : 3)} of {typeof totalCount === 'number' ? totalCount : results.length} results
      </div>

      <SignInHintInline />

      <div style={{ marginTop: 16 }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {results.slice(0, showAll ? results.length : 3).map((r, idx) => (
            <li key={(r.email || r.name || idx) + '-' + idx} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#111' }}>
                  {r.revealed ? (r.email || '(no email)') : maskEmail(r.email || '(no email)')}
                </div>
                <div style={{ color: '#666', fontSize: 13 }}>
                  {(r.name || '—') + (r.title ? ' • ' + r.title : '')}
                </div>
                {r.source && (
                  <div style={{ marginTop: 6 }}>
                    <a href={r.source} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#6b7280' }}>
                      Source
                    </a>
                  </div>
                )}
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
                openSigninModal();
              }
            }} style={{ padding: '.5rem .75rem', borderRadius: 6, background: '#007bff', color: '#fff', border: 'none' }}>
              {localStorage.getItem && localStorage.getItem('nh_session') ? `Show ${results.length - 3} more` : `Sign in to see all ${totalCount || results.length}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
