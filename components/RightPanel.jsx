import React from 'react';
import CorporateProfile from './CorporateProfile';

// RightPanel: corporate profile (big C), and "Take it for a test ride?" sample domains (small font).
// Updated to avoid unsafe `new URL(...)` usage in the browser.
export default function RightPanel({ domain, result }) {
  const PRELOAD = ['coca-cola.com', 'fordmodels.com', 'unitedtalent.com', 'wilhelmina.com', 'nfl.com'];

  function safeSetQueryDomain(d) {
    if (typeof window === 'undefined') return;
    try {
      const u = new URL(window.location.href);
      u.searchParams.set('domain', d);
      window.location.href = u.toString();
      return;
    } catch (e) {
      try {
        const pathname = (window.location && window.location.pathname) ? window.location.pathname : '/';
        const search = '?domain=' + encodeURIComponent(d);
        window.location.href = pathname + search;
      } catch (e2) {
        window.location.href = '/?domain=' + encodeURIComponent(d);
      }
    }
  }

  return (
    <div>
      <CorporateProfile domain={domain} result={result} />

      <div style={{ background: '#fff', padding: 12, borderRadius: 12, marginTop: 12 }}>
        <div style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>Take it for a test ride? Click a sample domain:</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {PRELOAD.map((d) => (
            <button
              key={d}
              onClick={() => safeSetQueryDomain(d)}
              style={{ textAlign: 'left', padding: '6px 8px', borderRadius: 6, border: '1px solid #e6edf3', background: '#fff', fontSize: 13 }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
