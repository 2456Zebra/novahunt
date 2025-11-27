import React from 'react';
import CorporateProfile from './CorporateProfile';

// RightPanel: simplified — only shows CorporateProfile and (optionally) the illustration.
// Removed the "Take it for a test ride" block (it's intentionally placed in the left column per your instruction).
export default function RightPanel({ domain, data /*, onSelectDomain intentionally unused here */ }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ height:28 }} /> {/* spacer to align big C with header logo top */}

      <CorporateProfile domain={domain} data={data} />

      {/* Illustration or decorative image underneath (if available) */}
      {data && data.illustration ? (
        <div style={{ marginTop:12, border:'1px solid #e6edf3', borderRadius:8, overflow:'hidden' }}>
          <img src={data.illustration} alt={`${data.name || domain} illustration`} style={{ width:'100%', display:'block' }} />
        </div>
      ) : null}
    </div>
  );
}
