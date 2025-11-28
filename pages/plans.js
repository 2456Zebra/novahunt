// pages/plans.js (v3-new-layout) - tidy plans header and Back to homepage link (no rectangle / underline only)

import React from 'react';
import Link from 'next/link';

export default function Plans() {
  return (
    <div style={{ padding: 32, fontFamily: 'Inter, system-ui, -apple-system, \"Segoe UI\", Roboto' }}>
      <div style={{ maxWidth:960, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <h1 style={{ margin:0 }}>Plans</h1>
          <Link href="/"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Back to homepage</a></Link>
        </div>

        <p style={{ color:'#6b7280' }}>Choose a plan to unlock full search results and scaled usage.</p>

        <div style={{ display:'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap:16, marginTop:20 }}>
          <div style={{ border:'1px solid #e6edf3', borderRadius:8, padding:18, background:'#fff' }}>
            <div style={{ fontWeight:800, fontSize:18 }}>Free</div>
            <div style={{ color:'#6b7280', marginTop:8 }}>Basic preview, limited lookups</div>
            <div style={{ marginTop:12 }}><a href="#" style={{ color:'#2563eb', textDecoration:'underline' }}>Select</a></div>
          </div>

          <div style={{ border:'1px solid #e6edf3', borderRadius:8, padding:18, background:'#fff' }}>
            <div style={{ fontWeight:800, fontSize:18 }}>Pro</div>
            <div style={{ color:'#6b7280', marginTop:8 }}>Full results, higher quota</div>
            <div style={{ marginTop:12 }}><a href="#" style={{ color:'#2563eb', textDecoration:'underline' }}>Select</a></div>
          </div>

          <div style={{ border:'1px solid #e6edf3', borderRadius:8, padding:18, background:'#fff' }}>
            <div style={{ fontWeight:800, fontSize:18 }}>Enterprise</div>
            <div style={{ color:'#6b7280', marginTop:8 }}>Custom limits and SLA</div>
            <div style={{ marginTop:12 }}><a href="#" style={{ color:'#2563eb', textDecoration:'underline' }}>Contact sales</a></div>
          </div>
        </div>
      </div>
    </div>
  );
}
