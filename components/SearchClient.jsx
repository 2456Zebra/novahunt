'use client';

import React, { useState } from 'react';

/**
 * Real-only client search widget.
 * - Always calls the real server endpoints: /api/search-contacts and /api/verify-contact
 * - Masks emails by default and reveals only after explicit verification
 * - Defaults to showing the full Hunter result set by default (showAll = true),
 *   but masks addresses; Reveal short-circuits for hunter-marked verified items.
 */
export default function SearchClient() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [showAll, setShowAll] = useState(true); // show provider results (mimic Hunter)
  const [revealed, setRevealed] = useState({});
  const [verifying, setVerifying] = useState({});

  const searchUrl = '/api/search-contacts';
  const verifyUrl = '/api/verify-contact';

  function maskEmail(email) {
    if (!email || typeof email !== 'string') return email;
    const [local, host] = email.split('@');
    if (!local || !host) return email;
    if (local.length <= 2) return `${local[0]}***@${host}`;
    const first = local[0];
    const last = local[local.length - 1];
    const stars = '*'.repeat(Math.max(3, Math.min(local.length - 2, 6)));
    return `${first}${stars}${last}@${host}`;
  }

  // Reveal: short-circuit if provider already marked as valid
  async function handleReveal(em) {
    const key = (em?.value || em?.email || '').toLowerCase();
    if (!key) return;

    // If Hunter already marked this email valid, reveal immediately (no extra API call)
    if (em?.verification?.status === 'valid') {
      const full = em?.value || em?.email || null;
      setRevealed((r) => ({ ...r, [key]: { ok: true, email: full, payload: { source: 'hunter', verification: em?.verification } } }));
      return;
    }

    setVerifying((v) => ({ ...v, [key]: true }));
    try {
      const res = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em?.value || em?.email }),
      });

      if (!res.ok) {
        const txt = await res.text();
        setRevealed((r) => ({ ...r, [key]: { ok: false, error: `Verification failed: ${res.status} ${txt}` } }));
      } else {
        const payload = await res.json();
        const verified =
          payload?.data?.data?.status === 'valid' ||
          payload?.data?.status === 'valid' ||
          payload?.status === 'valid';
        const full = em?.value || em?.email || payload?.data?.data?.email || payload?.email;
        if (verified && full) setRevealed((r) => ({ ...r, [key]: { ok: true, email: full, payload } }));
        else setRevealed((r) => ({ ...r, [key]: { ok: false, error: 'Not verified', payload } }));
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
      setError('Enter a website (for example coca-cola.com)');
      return;
    }

    setLoading(true);
    try {
      // ask server for up to 100 results (adjust limit as needed)
      const res = await fetch(searchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: trimmed, limit: 100 }),
      });

      if (!res.ok) {
        const txt = await res.text();
        setError(`Search error: ${res.status} ${txt}`);
        setLoading(false);
        return;
      }

      const payload = await res.json();

      const emails =
        (payload && payload.data && payload.data.data && payload.data.data.emails) ||
        (payload && payload.data && payload.data.emails) ||
        payload?.emails ||
        [];

      const meta = payload?.data?.meta || null;

      // dedupe keeping provider order
      const deduped = [];
      const seen = new Set();
      for (const e of emails) {
        const val = (e?.value || e?.email || '').toLowerCase();
        if (!val || seen.has(val)) continue;
        seen.add(val);
        deduped.push(e);
      }

      const verifiedOnly = deduped.filter((e) => e?.verification?.status === 'valid' && Array.isArray(e?.sources) && e.sources.length > 0);

      setResults({ raw: payload, meta, verifiedOnly, all: deduped });
      setRevealed({});
    } catch (err) {
      setError(err?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const renderRow = (em, i) => {
    const emailVal = em?.value || em?.email || '(no email)';
    const masked = maskEmail(emailVal);
    const name = [em?.first_name, em?.last_name].filter(Boolean).join(' ').trim() || em?.linkedin || 'Name not provided';
    const title = em?.position || em?.position_raw || 'Contact';
    const department = em?.department || '-';
    const verification = em?.verification?.status || '-';
    const primarySource = Array.isArray(em?.sources) && em.sources.length > 0 ? em.sources[0] : null;
    const key = (emailVal || `${title}-${i}`).toLowerCase();
    const revealState = revealed[key];
    const showFull = revealState?.ok === true;

    return (
      <tr key={key || i}>
        <td style={{ padding: 8, borderBottom: '1px solid #fafafa' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <strong style={{ marginBottom: 6 }}>{name}</strong>
            <span style={{ fontFamily: 'monospace' }}>{showFull ? revealState.email : masked}</span>

            <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: verification === 'valid' ? '#059669' : '#b45309', fontWeight: 600 }}>
                {verification === 'valid' ? 'Verified' : 'Unverified'}
              </span>
              {primarySource && (
                <a href={primarySource.uri} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563eb' }}>
                  source
                </a>
              )}
              {!showFull && (
                <button onClick={() => handleReveal(em)} disabled={verifying[key]} style={{ marginLeft: 8, fontSize: 12, padding: '4px 8px' }}>
                  {verifying[key] ? 'Checking…' : 'Reveal'}
                </button>
              )}
              {revealState && revealState.ok === false && <span style={{ color: '#ef4444', fontSize: 12 }}>{revealState.error || 'Not revealed'}</span>}
            </div>
          </div>
        </td>

        <td style={{ padding: 8, borderBottom: '1px solid #fafafa' }}>
          <div style={{ fontSize: 14 }}>{title}</div>
        </td>

        <td style={{ padding: 8, borderBottom: '1px solid #fafafa' }}>
          <div style={{ fontSize: 13, color: '#374151' }}>{department}</div>
        </td>
      </tr>
    );
  };

  return (
    <div style={{ maxWidth: 940, margin: '0 auto', padding: '1rem' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          placeholder="Enter a website (for example coca-cola.com)"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          style={{ flex: 1, padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '0.6rem 1rem', background: '#111827', color: 'white', border: 'none', borderRadius: 6 }} disabled={loading}>
          {loading ? 'Looking…' : 'Find Contacts'}
        </button>
      </form>

      {loading && (
        <div style={{ marginTop: 12 }}>
          <div style={{ height: 8, background: '#eee', borderRadius: 999 }}>
            <div style={{ height: 8, width: '50%', background: '#111827', borderRadius: 999, transition: 'width .3s' }} />
          </div>
        </div>
      )}

      {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}

      {results && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Contacts</h3>

          <div style={{ marginBottom: 8, color: '#374151', fontSize: 14 }}>
            {results.meta ? <>Showing {results.all.length} results (displaying {(showAll ? results.all.length : results.verifiedOnly.length)} on current filter)</> : <>Showing {results.all.length} results</>}
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 14, marginRight: 12 }}>
              <input type="checkbox" checked={showAll} onChange={() => setShowAll(!showAll)} /> Show all (including lower-trust)
            </label>
            <span style={{ color: '#6b7280', fontSize: 13 }}>We show hunter results by default. Click Reveal to show an email when you want it.</span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Name & Email</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Title</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Department</th>
              </tr>
            </thead>
            <tbody>{(showAll ? results.all : results.verifiedOnly).map(renderRow)}</tbody>
          </table>

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
