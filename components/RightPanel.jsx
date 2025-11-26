import React from 'react';
import CorporateProfile from './CorporateProfile';

// Right panel with sample preload domains and the decorative corporate profile.
// Big "C" will appear inside CorporateProfile; we add a small top spacer in the page so it visually aligns with the header/logo.
export default function RightPanel({ domain, result }) {
  const PRELOAD = ['coca-cola.com', 'fordmodels.com', 'unitedtalent.com', 'wilhelmina.com', 'nfl.com'];

  function setQueryDomain(d) {
    if (typeof window === 'undefined') return;
    var u = new URL(window.location.href);
    u.searchParams.set('domain', d);
    window.location.href = u.toString();
  }

  return (
    <div>
      {/* Corporate profile card (big C and summary) */}
      <div style={{ marginBottom: 12 }}>
        <CorporateProfile domain={domain} result={result} />
      </div>

      {/* Small "Take it for a test ride?" with sample domains in smaller font */}
      <div style={{ background: '#fff', padding: 12, borderRadius: 12 }}>
        <div style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>Take it for a test ride? Click a sample domain:</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {PRELOAD.map(function (d) {
            return (
              <button
                key={d}
                onClick={() => setQueryDomain(d)}
                style={{ textAlign: 'left', padding: '6px 8px', borderRadius: 6, border: '1px solid #e6edf3', background: '#fff', fontSize: 13 }}
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
