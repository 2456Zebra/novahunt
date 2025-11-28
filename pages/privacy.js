import React from 'react';
import Link from 'next/link';

export default function Privacy() {
  return (
    <div style={{ padding:32, fontFamily:'Inter, system-ui, -apple-system, \"Segoe UI\", Roboto' }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h1 style={{ margin:0 }}>Privacy Policy</h1>
          <Link href="/"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Back to homepage</a></Link>
        </div>

        <p style={{ color:'#374151' }}>
          NovaHunt uses server-side lookups and local demo storage for saved contacts. This policy is a template — consult legal counsel for production use.
        </p>

        <h3>Data we collect</h3>
        <p style={{ color:'#374151' }}>We collect domain lookups and may call third-party enrichment services. Saved contacts in the demo are stored locally.</p>
      </div>
    </div>
  );
}
