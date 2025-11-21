'use client';

import { useEffect, useState } from 'react';
import RevealButton from './RevealButton';
import Renderings from './Renderings';

/**
 * SearchClient — Hunt Emails only.
 * - Avoids LLM usage/costs.
 * - Uses Hunter-backed domain search via /api/find-emails.
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
          // Open plans so users can choose Free or upgrade
          window.location.href = '/plans';
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
    // Show first and last char with asterisks in between for consistent look
    if (local.length <= 2) return '*'.repeat(local.length) + '@' + domain;
    return `${local[0]}${'*'.repeat(Math.max(3, local.length - 2))}${local.slice(-1)}@${domain}`;
  } catch (e) {
    return email || '';
  }
}

export default function SearchClient() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [totalCount, setTotalCount] = useState(null);

  // Start with an empty input (no demo prefill)
  useEffect(() => {}, []);

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
      const resp = await fetch(`/api/find-emails?domain=${encodeURIComponent(q)}`);
      const bodyText = await resp.text().catch(() => '');
      let body = {};
      try { body = bodyText ? JSON.parse(bodyText) : {}; } catch (err) { body = { raw: bodyText }; }

      if (!resp.ok) {
        console.error('find-emails failed', resp.status, body);
        const msg = body && body.error ? body.error : `Server returned ${resp.status}`;
        setError(`Search failed: ${msg}`);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      const items = Array.isArray(body.items) ? body.items.map(it => ({ ...it, revealed: false })) : (body.items || []);
      setResults(items);
      setTotalCount(typeof body.total === 'number' ? body.total : items.length);
      if (body.usage) persistServerUsage(body.usage);
    } catch (err) {
      console.error('network error', err);
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

  function openPlans() {
    window.location.href = '/plans';
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 980, margin: '0 auto' }}>
      <h2 style={{ marginTop: 0 }}>Find Business Emails</h2>
      <p style={{ color: '#374151' }}>
        Confidence scores <strong>85%–100%</strong>.
      </p>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={domain}
          onChange={e => setDomain(e.target.value)}
          placeholder="e.g. fordmodels.com"
          style={{ padding: '.5rem', border: '1px solid #ddd', borderRadius: 6, minWidth: 280, flex: '1 1 360px' }}
        />

        <button type="submit" disabled={loading} style={{ padding: '.5rem 1rem', borderRadius: 8, background: '#007bff', color: '#fff', border: 'none', flex: '0 0 auto' }}>
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
                openPlans();
              }
            }} style={{ padding: '.5rem .75rem', borderRadius: 6, background: '#007bff', color: '#fff', border: 'none' }}>
              {localStorage.getItem && localStorage.getItem('nh_session') ? `Show ${results.length - 3} more` : `Sign in / upgrade to see all ${totalCount || results.length}`}
            </button>
          </div>
        )}
      </div>

      {/* Render illustrative cards below results */}
      <Renderings />
    </div>
  );
}