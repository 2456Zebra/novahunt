import React from 'react';
import CorporateProfile from './CorporateProfile';

// RightPanel: simplified and aligned.
// - No "contacts found" summary or edit/upload control.
// - Spacer reduced so right panel lines up with left column.
// - Illustration only displayed if present.

export default function RightPanel({ domain, data }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {/* Reduced spacer so top aligns with left column header */}
      <div style={{ height:8 }} />

      <CorporateProfile domain={domain} data={data} />

      {/* only show illustration when present */}
      {data && data.illustration ? (
        <div style={{ marginTop:12, border:'1px solid #e6edf3', borderRadius:8, overflow:'hidden' }}>
          <img src={data.illustration} alt={`${data.name || domain} illustration`} style={{ width:'100%', display:'block' }} />
        </div>
      ) : null}
    </div>
  );
}
