'use client';

import React, { useEffect, useState } from 'react';

/**
 * Client: supports opt-in include_inferred (signed-in only), colored confidence, pattern display.
 */
export default function SearchClient() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [revealed, setRevealed] = useState({});
  const [includeInferred, setIncludeInferred] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [sessionValue, setSessionValue] = useState(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem('nh_session');
      if (s) {
        setSignedIn(true);
        setSessionValue(s); // send this as header when requesting inferred
      } else {
        setSignedIn(false);
        setSessionValue(null);
      }
    } catch (e) {
      setSignedIn(false);
    }
  }, []);

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

  function confidenceColor(c) {
    if (c == null) return '#6b7280';
    const n = Number(c);
    if (isNaN(n)) return '#6b7280';
    if (n >= 90) return '#059669'; // green
    if (n >= 75) return '#16a34a'; // green-strong
    if (n >= 60) return '#f59e0b'; // amber
    return '#ef4444'; // red
  }

  function handleReveal(em) {
    const key = (em?.value || em?.email || '').toLowerCase();
    if (!key) return;
    const full = em?.value || em?.email || null;
    setRevealed((r) => ({ ...r, [key]: { ok: true, email: full, userRevealed: true } }));
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
      const headers = { 'Content-Type': 'application/json' };
      if (includeInferred && sessionValue) {
        // send local session string to allow server to honor include_inferred
        headers['x-nh-session'] = sessionValue;
      }

      const res = await fetch('/api/search-contacts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ domain: trimmed, limit: 100, include_inferred: includeInferred }),
      });

      if (!res.ok) {
        const txt = await res.text();
        setError(`Search error: ${res.status} ${txt}`);
        setLoading(false);
        return;
      }

      const payload = await res.json();

      const hunterEmails =
        payload?.data?.data?.emails ??
        payload?.data?.emails ??
        payload?.emails ??
        [];

      const filtered = hunterEmails.filter((e) => !!(e?.value || e?.email));

      setResults({
        raw: payload,
        all: filtered,
        meta: payload?.data?.meta ?? null,
        filtered_out: payload?.data?.meta?.filtered_out ?? 0,
        pattern: payload?.data?.data?.pattern ?? null,
      });
    } catch (err) {
      setError(err?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const renderConfidence = (em) => {
    const c = em?.confidence ?? em?.confidence_score ?? em?.score;
    if (c == null) return null;
    const val = typeof c === 'number' ? Math.round(c) : c;
    const color = confidenceColor(val);
    return (
      <span style={{ fontSize: 12, color, marginLeft: 8, fontWeight: 600 }}>
        {val}% 
      </span>
    );
  };

  const renderRow = (em, i) => {
    const emailVal = em?.value || em?.email || '(no email)';
    const key = (emailVal || `${i}`).toLowerCase();
    const showFull = revealed[key]?.ok === true && revealed[key]?.userRevealed === true;
    const masked = maskEmail(emailVal);
    const name = [em?.first_name, em?.last_name].filter(Boolean).join(' ').trim() || em?.linkedin || 'Name not provided';
    const title = em?.position || em?.position_raw || '-';
    const department = em?.department || '-';
    const verification = em?.verification?.status || '-';
    const primarySource = Array.isArray(em?.sources) && em.sources.length > 0 ? em.sources[0] : null;

    return (
      <tr key={key}>
        <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <strong style={{ marginBottom: 6 }}>{name}</strong>
              {renderConfidence(em)}
            </div>

            <span style={{ fontFamily: 'monospace' }}>{showFull ? revealed[key].email : masked}</span>

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
                <button onClick={() => handleReveal(em)} style={{ marginLeft: 8, fontSize: 12, padding: '4px 8px' }}>
                  Reveal
                </button>
              )}
            </div>
          </div>
        </td>

        <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{title}</td>
        <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{department}</td>
      </tr>
    );
  };

  return (
    <div style={{ maxWidth: 940, margin: '0 auto', padding: '1rem' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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

        {signedIn && (
          <label style={{ marginLeft: 12, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={includeInferred} onChange={(e) => setIncludeInferred(e.target.checked)} />
            Include inferred addresses (signed-in only)
          </label>
        )}
      </form>

      {loading && <div style={{ marginTop: 12 }}>Loading…</div>}
      {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}

      {results && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Contacts</h3>

          <div style={{ marginBottom: 8, color: '#374151', fontSize: 14 }}>
            {results.meta ? (
              <>
                Showing {results.all.length} of {results.meta?.results ?? 'unknown'} results.
                {typeof results.filtered_out === 'number' && results.filtered_out > 0 && (
                  <span style={{ marginLeft: 8, color: '#6b7280' }}>{results.filtered_out} low-trust results hidden</span>
                )}
                {results.pattern && <span style={{ marginLeft: 8, color: '#9ca3af' }}>Email pattern: {results.pattern}</span>}
                <span style={{ marginLeft: 8, color: '#6b7280' }}>Powered by AI</span>
              </>
            ) : (
              <>
                Showing {results.all.length} results <span style={{ marginLeft: 8, color: '#6b7280' }}>Powered by AI</span>
              </>
            )}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Name & Email</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Title</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Department</th>
              </tr>
            </thead>
            <tbody>{results.all.map(renderRow)}</tbody>
          </table>

          <details style={{ marginTop: 12 }}>
            <summary>Raw response (debug)</summary>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, maxHeight: 400, overflow: 'auto', background: '#f7f7f7', padding: 8 }}>
              {JSON.stringify(results.raw, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
