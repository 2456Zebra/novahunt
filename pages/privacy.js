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
          NovaHunt uses server-side proxies to fetch public contact data. Saved contacts are stored locally unless you connect an account.
          We recommend reviewing applicable laws before outreach. This privacy page is a starter template — please consult legal counsel for production.
        </p>
      </div>
    </div>
  );
}
