import React from 'react';
import CorporateProfile from './CorporateProfile';

// RightPanel: align with left column by matching the same top spacer height used there.
// Use a spacer so the visual top aligns with the main left content.
export default function RightPanel({ domain, data }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12, alignItems:'stretch' }}>
      {/* Spacer to align top with left column header (matches left column spacing) */}
      <div style={{ height:28 }} />

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
