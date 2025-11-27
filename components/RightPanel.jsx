import React from 'react';
import CorporateProfile from './CorporateProfile';

// RightPanel: corporate profile (big C) and sample "test ride" links.
export default function RightPanel({ domain, data, onSelectDomain }) {
  const PRELOAD = ['coca-cola.com','fordmodels.com','unitedtalent.com','wilhelmina.com','nfl.com'];

  function safeSelect(d) {
    if (typeof onSelectDomain === 'function') onSelectDomain(d);
    else {
      // fallback: navigate the current page (client-only demos)
      if (typeof window !== 'undefined') {
        const u = new URL(window.location.href);
        u.searchParams.set('domain', d);
        window.location.href = u.toString();
      }
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ height:28 }} /> {/* spacer to align big C with header logo top */}
      <CorporateProfile domain={domain} data={data} />

      <div style={{ background:'#fff', border:'1px solid #e6edf3', borderRadius:8, padding:12 }}>
        <div style={{ fontSize:13, color:'#6b7280', marginBottom:8 }}>Take it for a test ride? Click a sample domain:</div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {PRELOAD.map(d => (
            <button key={d} onClick={() => safeSelect(d)} style={{ textAlign:'left', padding:'6px 8px', borderRadius:6, border:'1px solid #e6edf3', background:'#fff', fontSize:13, cursor:'pointer' }}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* optional area for image/description handled inside CorporateProfile or other components */}
    </div>
  );
}
