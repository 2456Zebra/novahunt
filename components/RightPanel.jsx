import React from 'react';
import CorporateProfile from './CorporateProfile';

// Right panel with sample preload domains and the decorative corporate profile.
// Note: we intentionally do NOT duplicate "Top contacts" in this panel (it appears in main content only).
export default function RightPanel({ domain, result }) {
  const PRELOAD = ['coca-cola.com', 'fordmodels.com', 'unitedtalent.com', 'wilhelmina.com', 'nfl.com'];

  function setQueryDomain(d) {
    if (typeof window === 'undefined') return;
    var u = new URL(window.location.href);
    u.searchParams.set('domain', d);
    // reload to let SearchClient pick up query param on mount
    window.location.href = u.toString();
  }

  return (
    <div>
      <CorporateProfile domain={domain} result={result} />

      <div style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Try a sample</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PRELOAD.map(function (d) {
            return (
              <button
                key={d}
                onClick={() => setQueryDomain(d)}
                style={{ textAlign: 'left', padding: 8, borderRadius: 8, border: '1px solid #e6edf3', background: '#fff' }}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
