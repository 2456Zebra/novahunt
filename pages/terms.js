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
          These Terms govern your use of NovaHunt. By using NovaHunt you agree to use data responsibly and to comply with applicable laws.
        </p>

        <h3>Acceptable use</h3>
        <p style={{ color:'#374151' }}>You may not use NovaHunt to send spam, harass, or violate privacy laws. Use contact data responsibly and ethically.</p>

        <h3>Limitation of liability</h3>
        <p style={{ color:'#374151' }}>NovaHunt provides data as-is and is not responsible for outreach outcomes. This is a template — consult legal counsel before publishing.</p>
      </div>
    </div>
  );
}
