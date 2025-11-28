import React from 'react';
import Link from 'next/link';

// Updated About page: friendlier, removed the "Need help?" paragraph and added CTA to Plans.
export default function About() {
  return (
    <div style={{ padding: 32, fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto' }}>
      <div style={{ maxWidth:1000, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 8 }}>
          <h1 style={{ margin:0 }}>About NovaHunt</h1>
          <Link href="/"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Back to homepage</a></Link>
        </div>

        <p style={{ color:'#374151', fontSize:16, lineHeight:1.6 }}>
          NovaHunt helps creative people and small teams find the right contacts to get things done — landing an agent,
          booking a gig, or finding the buyer who will sign your next contract.
        </p>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:16, marginTop:20 }}>
          <div style={{ background:'#fff', border:'1px solid #e6edf3', borderRadius:8, padding:16 }}>
            <div style={{ fontSize:22 }}>For Models</div>
            <div style={{ color:'#6b7280', marginTop:8 }}>
              Locate modelling agencies, casting contacts, and booking managers so you can pitch and audition with confidence.
            </div>
            <div style={{ fontSize:36, marginTop:12 }}>👗</div>
          </div>

          <div style={{ background:'#fff', border:'1px solid #e6edf3', borderRadius:8, padding:16 }}>
            <div style={{ fontSize:22 }}>For Actors</div>
            <div style={{ color:'#6b7280', marginTop:8 }}>
              Search agents and casting directors to discover auditions and representation opportunities.
            </div>
            <div style={{ fontSize:36, marginTop:12 }}>🎭</div>
          </div>

          <div style={{ background:'#fff', border:'1px solid #e6edf3', borderRadius:8, padding:16 }}>
            <div style={{ fontSize:22 }}>For Musicians</div>
            <div style={{ color:'#6b7280', marginTop:8 }}>
              Discover promoters, venues, and booking agents to land shows and grow your audience.
            </div>
            <div style={{ fontSize:36, marginTop:12 }}>🎵</div>
          </div>

          <div style={{ background:'#fff', border:'1px solid #e6edf3', borderRadius:8, padding:16 }}>
            <div style={{ fontSize:22 }}>For Freelancers & Creatives</div>
            <div style={{ color:'#6b7280', marginTop:8 }}>
              Locate hiring managers and decision-makers to pitch your services and win work.
            </div>
            <div style={{ fontSize:36, marginTop:12 }}>💼</div>
          </div>

          <div style={{ background:'#fff', border:'1px solid #e6edf3', borderRadius:8, padding:16 }}>
            <div style={{ fontSize:22 }}>For Photographers</div>
            <div style={{ color:'#6b7280', marginTop:8 }}>
              Find art directors, magazines and brands that hire photographers for shoots and campaigns.
            </div>
            <div style={{ fontSize:36, marginTop:12 }}>📸</div>
          </div>

          <div style={{ background:'#fff', border:'1px solid #e6edf3', borderRadius:8, padding:16 }}>
            <div style={{ fontSize:22 }}>For Founders</div>
            <div style={{ color:'#6b7280', marginTop:8 }}>
              Reach investors, mentors, and partners who can help you grow your idea into a business.
            </div>
            <div style={{ fontSize:36, marginTop:12 }}>🚀</div>
          </div>
        </div>

        <h3 style={{ marginTop:24 }}>Our promise</h3>
        <p style={{ color:'#374151', lineHeight:1.6 }}>
          We help you find the right person to contact — fast. The right panel gives friendly context so you know who you’re reaching out to;
          the left column is where the actionable contacts live.
        </p>

        <div style={{ marginTop:18 }}>
          <Link href="/plans"><a style={{ color:'#2563eb', textDecoration:'underline', fontWeight:700 }}>
            Sign up and let us help you make your dreams and ambitions come true!
          </a></Link>
        </div>
      </div>
    </div>
  );
}
