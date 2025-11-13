'use client';

import React, { useState } from 'react';

/**
 * Client-only search widget (improved with masking + reveal).
 * - Masks email addresses by default.
 * - Shows verification status, date, source link.
 * - "Reveal" button calls /api/hunter-verify to attempt a verification (server-side).
 *
 * Note: revealing unverified emails will call Hunter's verification API and may use credits.
 */
export default function SearchClient() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [revealed, setRevealed] = useState({}); // emailValue -> revealedFullEmail or error state
  const [verifying, setVerifying] = useState({}); // emailValue -> boolean

  function maskEmail(email) {
    if (!email || typeof email !== 'string') return email;
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    const first = local[0];
    const last = local[local.length - 1];
    const stars = '*'.repeat(Math.max(3, Math.min(local.length - 2, 6)));
    return `${first}${stars}${last}@${domain}`;
  }

  async function handleReveal(em) {
    const key = em?.value || em?.email;
    if (!key) return;
    // If server-side metadata already shows verified, reveal locally
    if (em?.verification?.status === 'valid' && em?.value) {
      setRevealed((r) => ({ ...r, [key]: { ok: true, email: em.value } }));
      return;
    }

    // Otherwise call verify API
    setVerifying((v) => ({ ...v, [key]: true }));
    try {
      const res = await fetch('/api/hunter-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em?.value || em?.email }),
      });
      if (!res.ok) {
        const txt = await res.text();
        setRevealed((r) => ({ ...r, [key]: { ok: false, error: `verify failed: ${res.status} ${txt}` } }));
      } else {
        const payload = await res.json();
        // payload should hold verification result; reveal if valid
        const status = payload?.data?.data?.result || payload?.result || payload?.status || payload?.data?.status;
        const full = em?.value || em?.email || payload?.data?.data?.email || payload?.email;
        const verified = payload?.data?.data?.status === 'valid' || payload?.data?.status === 'valid' || status === 'valid';
        if (verified && full) {
          setRevealed((r) => ({ ...r, [key]: { ok: true, email: full, payload } }));
        } else {
          setRevealed((r) => ({ ...r, [key]: { ok: false, error: 'Not verified', payload } }));
        }
      }
    } catch (err) {
      setRevealed((r) => ({ ...r, [key]: { ok: false, error: err?.message || 'Unknown error' } }));
    } finally {
      setVerifying((v) => ({ ...v, [key]: false }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResults(null);

    const trimmed = (domain || '').trim();
    if (!trimmed) {
      setError('Please enter a domain (e.g. example.com)');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/hunter-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: trimmed }),
      });

      if (!res.ok) {
        const txt = await res.text();
        setError(`API error: ${res.status} ${txt}`);
        setLoading(false);
        return;
      }

      const payload = await res.json();

      // Hunter payload path
      const emails =
        (payload && payload.data && payload.data.data && payload.data.data.emails) ||
        (payload && payload.data && payload.data.emails) ||
        payload?.emails ||
        [];

      const meta = payload?.data?.meta || null;

      // Dedupe
      const deduped = [];
      const seen = new Set();
      for (const e of emails) {
        const val = (e?.value || e?.email || '').toLowerCase();
        if (!val || seen.has(val)) continue;
        seen.add(val);
        deduped.push(e);
      }

      // Partition high-quality vs others
      const highQuality = deduped.filter((e) => {
        const verified = e?.verification?.status === 'valid';
        const hasSources = Array.isArray(e?.sources) && e.sources.length > 0;
        const conf = typeof e?.confidence === 'number' ? e.confidence : (typeof e?.score === 'number' ? e.score : 0);
        return verified && hasSources && conf >= 60;
      });

      const lowQuality = deduped.filter((e) => !highQuality.includes(e));

      setResults({ raw: payload, meta, highQuality, lowQuality, all: [...highQuality, ...lowQuality] });
      setRevealed({}); // clear previous reveals
    } catch (err) {
      setError(err?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const renderEmailRow = (em, i) => {
    const emailVal = em?.value || em?.email || '(no email)';
    const masked = maskEmail(emailVal);
    const type = em?.type || em?.source || '-';
    const conf = em?.confidence ?? em?.score ?? '-';
    const verificationStatus = em?.verification?.status || 'unknown';
    const verificationDate = em?.verification?.date || null;
    const primarySource = Array.isArray(em?.sources) && em.sources.length > 0 ? em.sources[0] : null;
    const key = emailVal || `${type}-${i}`;

    const revealState = revealed[key];

    return (
      <tr key={i}>
        <td style={{ padding: 8, borderBottom: '1px solid #fafafa' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: 'monospace' }}>
              {revealState?.ok ? revealState.email : masked}
            </span>

            <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
              {verificationStatus === 'valid' ? (
                <span style={{ color: '#059669', fontSize: 12, fontWeight: 600 }}>Verified</span>
              ) : (
                <span style={{ color: '#b45309', fontSize: 12 }}>Unverified</span>
              )}
              {verificationDate && <span style={{ fontSize: 12, color: '#6b7280' }}>({verificationDate})</span>}
              {primarySource && (
                <a href={primarySource.uri} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563eb' }}>
                  source
                </a>
              )}

              {/* Reveal button / status */}
              {!revealState?.ok && (
                <button
                  onClick={() => handleReveal(em)}
                  disabled={verifying[key]}
                  style={{ marginLeft: 8, fontSize: 12, padding: '4px 8px', cursor: 'pointer' }}
                >
                  {verifying[key] ? 'Verifying…' : 'Reveal'}
                </button>
              )}

              {revealState && revealState.ok === false && (
                <span style={{ color: '#ef4444', fontSize: 12 }}>{revealState.error || 'Not verified'}</span>
              )}
            </div>
          </div>
        </td>
        <td style={{ padding: 8, borderBottom: '1px solid #fafafa' }}>{type}</td>
        <td style={{ padding: 8, borderBottom: '1px solid #fafafa' }}>{conf}</td>
      </tr>
    );
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '1rem' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          placeholder="Enter domain (e.g. coca-cola.com)"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          style={{ flex: 1, padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc' }}
        />
        <button
          type="submit"
          style={{
            padding: '0.6rem 1rem',
            background: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
          disabled={loading}
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {loading && (
        <div style={{ marginTop: 12 }}>
          <div style={{ height: 8, background: '#eee', borderRadius: 999 }}>
            <div style={{ height: 8, width: '60%', background: '#0070f3', borderRadius: 999, transition: 'width .3s' }} />
          </div>
        </div>
      )}

      {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}

      {results && (
        <div style={{ marginTop: 16 }}>
          <h3>Results</h3>

          <div style={{ marginBottom: 8, color: '#374151', fontSize: 14 }}>
            {results.meta ? (
              <>
                Showing {results.all.length} of {results.meta.results} total results (API limit {results.meta.limit})
              </>
            ) : (
              <>Showing {results.all.length} results</>
            )}
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 14, marginRight: 12 }}>
              <input type="checkbox" checked={showAll} onChange={() => setShowAll(!showAll)} /> Show all (including unverified)
            </label>
            <span style={{ color: '#6b7280', fontSize: 13 }}>
              By default we show verified addresses first (verification & source required). Click Reveal to attempt a verification (may use Hunter credits).
            </span>
          </div>

          {Array.isArray(showAll ? results.all : results.highQuality) && (showAll ? results.all : results.highQuality).length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {(showAll ? results.all : results.highQuality).map(renderEmailRow)}
              </tbody>
            </table>
          ) : (
            <p>No high-quality emails found for this domain. Toggle "Show all" to reveal unverified or inferred emails.</p>
          )}

          <details style={{ marginTop: 12 }}>
            <summary>Raw response (debug)</summary>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, maxHeight: 300, overflow: 'auto', background: '#f7f7f7', padding: 8 }}>
              {JSON.stringify(results.raw, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
