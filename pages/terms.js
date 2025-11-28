import React from 'react';
import Link from 'next/link';

export default function Terms() {
  return (
    <div style={{ padding:32, fontFamily:'Inter, system-ui, -apple-system, \"Segoe UI\", Roboto' }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h1 style={{ margin:0 }}>Terms of Service</h1>
          <Link href="/"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Back to homepage</a></Link>
        </div>
        <p style={{ color:'#374151' }}>
          These Terms of Service govern your use of NovaHunt. By using the service you agree not to misuse contact data, to respect privacy and applicable laws,
          and to use results only for legitimate business or personal outreach. This is a short placeholder — replace with full legal text from counsel.
        </p>
      </div>
    </div>
  );
}
