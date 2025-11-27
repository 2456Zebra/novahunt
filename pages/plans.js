// Small patch to add "Back to homepage" button at top of plans page.

import React from 'react';
import Link from 'next/link';

export default function Plans() {
  return (
    <div style={{ padding: 32, fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto' }}>
      <div style={{ maxWidth:960, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h1 style={{ margin:0 }}>Plans</h1>
          <Link href="/"><a style={{ padding:'8px 12px', borderRadius:6, background:'#fff', border:'1px solid #e6edf3', color:'#2563eb', textDecoration:'none' }}>Back to homepage</a></Link>
        </div>

        <p style={{ color:'#6b7280' }}>Choose a plan to unlock full search results and scaled usage.</p>

        {/* existing plans content preserved below this header */}
        <div style={{ marginTop:20 }}>
          {/* keep the existing content from your current plans.js here */}
        </div>
      </div>
    </div>
  );
}
