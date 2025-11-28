import React from 'react';
import CorporateProfile from './CorporateProfile';

// RightPanel: raise slightly so it visually aligns with left column.
// We use a negative top margin to nudge it up ~1/4 inch (approx 18px).
export default function RightPanel({ domain, data }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12, alignItems:'stretch', marginTop: '-18px' }}>
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
