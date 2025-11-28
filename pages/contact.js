import React from 'react';
import Link from 'next/link';

export default function Contact() {
  return (
    <div style={{ padding:32, fontFamily:'Inter, system-ui, -apple-system, \"Segoe UI\", Roboto' }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h1 style={{ margin:0 }}>Contact</h1>
          <Link href="/"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Back to homepage</a></Link>
        </div>
        <p style={{ color:'#374151' }}>
          For support or inquiries, email us at <a href="mailto:support@novahunt.ai">support@novahunt.ai</a>.
        </p>
      </div>
    </div>
  );
}
