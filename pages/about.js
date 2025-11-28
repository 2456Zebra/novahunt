// pages/about.js (v3-new-layout) - refreshed About page with Back to homepage.

import React from 'react';
import Link from 'next/link';

export default function About() {
  return (
    <div style={{ padding: 32, fontFamily: 'Inter, system-ui, -apple-system, \"Segoe UI\", Roboto' }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <h1 style={{ margin:0 }}>About NovaHunt</h1>
          <Link href="/"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Back to homepage</a></Link>
        </div>

        <p style={{ color:'#374151', fontSize:16, lineHeight:1.6 }}>
          NovaHunt helps you find verified business email addresses quickly so you can reach the right decision makers.
          We combine public sources and third-party enrichment to surface contacts and decorate results with company context.
        </p>

        <h3 style={{ marginTop:24 }}>Our philosophy</h3>
        <p style={{ color:'#374151', lineHeight:1.6 }}>
          We focus on delivering useful, defensible contact results — and a simple UX that lets you start outreach fast.
          The right panel is intentionally decorative to give context while your main value is the contact data on the left.
        </p>

        <h3 style={{ marginTop:20 }}>Privacy</h3>
        <p style={{ color:'#374151', lineHeight:1.6 }}>
          We use server-side proxies for third-party APIs so keys remain secret. Saved contacts are stored locally until you connect an account. For production, we recommend storing saved contacts in a user-specific DB tied to authentication.
        </p>
      </div>
    </div>
  );
}
