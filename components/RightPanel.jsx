import React from 'react';
import CorporateProfile from './CorporateProfile';

// Simple right panel: shows a decorative corporate profile and a quick sample list
export default function RightPanel({ domain, result }) {
  const PRELOAD = ['coca-cola.com', 'fordmodels.com', 'unitedtalent.com', 'wilhelmina.com', 'nfl.com'];

  return (
    <aside>
      <div style={{ background: 'white', padding: 16, borderRadius: 12, marginBottom: 12 }}>
        <CorporateProfile domain={domain} result={result} />
      </div>

      <div style={{ background: 'white', padding: 12, borderRadius: 12, marginBottom: 12 }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Try a sample</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PRELOAD.map((d) => (
            <button key={d} onClick={() => window && window.location && (window.location.search = '?domain=' + encodeURIComponent(d))} style={{ textAlign: 'left', padding: 8, borderRadius: 8, border: '1px solid #e6edf3', background: '#fff' }}>
              {d}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: 'white', padding: 12, borderRadius: 12 }}>
        <div style={{ fontWeight: 700 }}>View Results</div>
        <div style={{ color: '#64748b', marginTop: 8 }}>Export</div>
        <div style={{ marginTop: 12 }}>
          <a href="/plans" style={{ color: '#2563eb' }}>See Plans</a>
        </div>
      </div>
    </aside>
  );
}
