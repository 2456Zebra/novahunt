import React from 'react';
import Link from 'next/link';

export default function About() {
  const items = [
    { title: 'For Models', text: 'Locate modelling agencies, casting contacts, and booking managers so you can pitch and audition with confidence.', icon: '👗' },
    { title: 'For Actors', text: 'Search agents and casting directors to discover auditions and representation opportunities.', icon: '🎭' },
    { title: 'For Musicians', text: 'Discover promoters, venues, and booking agents to land shows and grow your audience.', icon: '🎵' },
    { title: 'For Freelancers & Creatives', text: 'Locate hiring managers and decision-makers to pitch your services and win work.', icon: '💼' },
    { title: 'For Photographers', text: 'Find art directors, magazines and brands that hire photographers for shoots and campaigns.', icon: '📸' },
    { title: 'For Founders', text: 'Reach investors, mentors, and partners who can help you grow your idea into a business.', icon: '🚀' },
    { title: 'For Influencers', text: 'Find brand PR and sponsorship contacts that can help you land paid collaborations.', icon: '📣' },
    { title: 'For Sellers', text: 'Discover the right buyer contacts and procurement leads to accelerate sales.', icon: '🏷️' },
    { title: 'For Event Planners', text: 'Locate venue contacts, caterers, and vendors to plan and execute successful events.', icon: '📋' }
  ];

  return (
    <div style={{ padding: 32, paddingBottom: 96, fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto' }}>
      <div style={{ maxWidth:1000, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 8 }}>
          <h1 style={{ margin:0 }}>About NovaHunt</h1>
          <Link href="/"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Back to homepage</a></Link>
        </div>

        <p style={{ color:'#374151', fontSize:16, lineHeight:1.6 }}>
          NovaHunt helps creatives and small teams find the right contacts to get things done — landing representation, booking gigs, or winning new clients.
        </p>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:16, marginTop:20 }}>
          {items.map((it, i) => (
            <div key={i} style={{ background:'#fff', border:'1px solid #e6edf3', borderRadius:8, padding:16 }}>
              <div style={{ fontSize:22 }}>{it.title}</div>
              <div style={{ color:'#6b7280', marginTop:8 }}>{it.text}</div>
              <div style={{ fontSize:36, marginTop:12 }}>{it.icon}</div>
            </div>
          ))}
        </div>

        <h3 style={{ marginTop:24 }}>Our promise</h3>
        <p style={{ color:'#374151', lineHeight:1.6 }}>
          We help you find the right person to contact — fast. The right panel gives friendly context while the left column provides the actionable contacts.
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
