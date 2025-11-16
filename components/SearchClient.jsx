'use client';

import React, { useEffect, useState } from 'react';

/**
 * SearchClient:
 * - No "Email pattern" shown.
 * - Shows "Showing X of Y results. Upgrade to see all." with clickable Upgrade link.
 * - Signed-in users see a checkbox "Include lower-trust results" that requests include_inferred on the server.
 * - Sends local nh_session in header when include_inferred is requested (server honors only if header present).
 * - Colored confidence indicator preserved.
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
        setSessionValue(s);
      } else {
        setSignedIn(false);
        setSessionValue(null);
      }
      // listen for session changes
      function onAuth(e) {
        const email = e?.detail?.email;
        if (email) {
          const s = localStorage.getItem('nh_session');
          setSignedIn(!!s);
          setSessionValue(s || null);
        } else {
          setSignedIn(false);
          setSessionValue(null);
        }
      }
      window.addEventListener('nh:auth-change', onAuth);
      return () => window.removeEventListener('nh:auth-change', onAuth);
    } catch (err) {
      // ignore
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
    if (n >= 75) return '#16a34a';
    if (n >= 60) return '#f59e0b'; // amber
    return '#ef4444'; // red
  }

  async function handleReveal(em) {
    const key = (em?.value || em?.email || '').toLowerCase();
    if (!key) return;
    
    // Check if user is signed in
    const session = sessionValue || localStorage.getItem('nh_session');
    if (!session) {
      alert('Please sign in to reveal full emails.');
      // Open sign-in modal
      window.dispatchEvent(new CustomEvent('nh:open-auth', { detail: { mode: 'signin' } }));
      return;
    }
    
    // Call the reveal API endpoint
    try {
      const res = await fetch('/api/reveal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nh-session': session
        },
        body: JSON.stringify({ contactId: key, email: key, ...em })
      });
      
      const json = await res.json();
      
      if (res.status === 401) {
        alert('Authentication required. Please sign in again.');
        localStorage.removeItem('nh_session');
        setSignedIn(false);
        setSessionValue(null);
        return;
      }
      
      if (res.status === 402) {
        alert(`Reveal limit reached for your plan. ${json.error || 'Please upgrade to continue.'}`);
        return;
      }
      
      if (!res.ok) {
        alert(`Reveal failed: ${json.error || 'Unknown error'}`);
        return;
      }
      
      // Success - store revealed email
      const full = em?.value || em?.email || null;
      setRevealed((r) => ({ ...r, [key]: { ok: true, email: full, userRevealed: true } }));
      
      // Dispatch event to update usage widget
      try { window.dispatchEvent(new Event('account-usage-updated')); } catch (e) { /* ignore */ }
    } catch (err) {
      alert(`Error: ${err.message || 'Network error'}`);
    }
  }

  async function performSearch(domainValue, useInferred = false) {
    setError('');
    setResults(null);
    setLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (useInferred && sessionValue) headers['x-nh-session'] = sessionValue;

      const res = await fetch('/api/search-contacts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ domain: domainValue, limit: 100, include_inferred: !!useInferred }),
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
      });
    } catch (err) {
      setError(err?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const trimmed = (domain || '').trim();
    if (!trimmed) {
      setError('Enter a website (for example coca-cola.com)');
      return;
    }
    await performSearch(trimmed, includeInferred);
  }

  // If signed in and includeInferred toggled while results exist, re-run search automatically
  useEffect(() => {
    if (results && results.raw && signedIn) {
      // re-run with new preference
      (async () => {
        if (domain && domain.trim()) await performSearch(domain.trim(), includeInferred);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeInferred]);

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

  // If user tries to enable Include lower-trust while not signed in, open the auth modal
  function handleIncludeInferredToggle(e) {
    const wants = e.target.checked;
    if (wants && !signedIn) {
      // request auth: header listener in header will open modal
      window.dispatchEvent(new CustomEvent('nh:open-auth', { detail: { mode: 'signin' } }));
      return;
    }
    setIncludeInferred(wants);
  }

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

        <label style={{ marginLeft: 12, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={includeInferred} onChange={handleIncludeInferredToggle} />
          Include lower-trust results (signed-in only)
        </label>
      </form>

      {loading && <div style={{ marginTop: 12 }}>Loading…</div>}
      {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}

      {results && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Contacts</h3>

          <div style={{ marginBottom: 8, color: '#374151', fontSize: 14 }}>
            {results.meta ? (
              <>
                Showing {signedIn ? results.all.length : Math.min(results.all.length, 3)} of {results.meta?.results ?? 'unknown'} results.{' '}
                {!signedIn && results.all.length > 3 && <span style={{ color: '#d97706', fontWeight: 600 }}>Sign in to see all results.</span>}{' '}
                <a href="/upgrade" style={{ color: '#2563eb', marginLeft: 6, textDecoration: 'underline' }}>Upgrade to see all</a>{' '}
                {results.filtered_out > 0 && <span style={{ marginLeft: 8, color: '#6b7280' }}>{results.filtered_out} low-trust results hidden</span>}
                <span style={{ marginLeft: 8, color: '#6b7280' }}>Powered by AI</span>
              </>
            ) : (
              <>
                Showing {signedIn ? results.all.length : Math.min(results.all.length, 3)} results{' '}
                {!signedIn && results.all.length > 3 && <span style={{ color: '#d97706', fontWeight: 600 }}>Sign in to see all results.</span>}{' '}
                <span style={{ marginLeft: 8, color: '#6b7280' }}>Powered by AI</span>
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
            <tbody>{(signedIn ? results.all : results.all.slice(0, 3)).map(renderRow)}</tbody>
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
