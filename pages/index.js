import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import RightPanel from '../components/RightPanel';
import ErrorBoundary from '../components/ErrorBoundary';

// Minimal sample fallback if the API is unavailable (keeps page usable)
const SAMPLE = {
  "coca-cola.com": {
    name: "The Coca-Cola Company",
    domain: "coca-cola.com",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/49/Coca-Cola_logo.png",
    illustration: "https://upload.wikimedia.org/wikipedia/commons/3/36/Coca-Cola-1898_ad.jpg",
    description: "Coca‑Cola is a global beverage leader...",
    contacts: [
      { first_name:"Ivy", last_name:"Crawford", position:"Senior Director, Execution", email:"ivy.crawford@coca-cola.com", department:"management", photo: null },
      { first_name:"Tiffany", last_name:"Stone", position:"Senior Director of Marketing", email:"tiffany.stone@coca-cola.com", department:"marketing", photo: null },
      { first_name:"Tina", last_name:"Gutierrez", position:"Director of Program Innovation", email:"tina.gutierrez@coca-cola.com", department:"management", photo: null },
      { first_name:"Mark", last_name:"Mitchell", position:"Director of Cloud Services", email:"mark.mitchell@coca-cola.com", department:"management", photo: null },
      { first_name:"Kimberly", last_name:"Burks", position:"Executive Assistant", email:"kimberly.burks@coca-cola.com", department:"operations", photo: null }
    ],
    facts: {
      Date: "1892 - present",
      Ticker: "KO",
      Sector: "Consumer Staples",
      Industry: "Beverages",
      CEO: "Mr. James Robert B. Quincey",
      Headquarters: "Atlanta"
    },
    total: 444,
    shown: 5
  }
};

const SAMPLE_DOMAINS = ["coca-cola.com","fordmodels.com","unitedtalent.com","wilhelmina.com","nfl.com"];

// small helpers
function maskEmail(email){
  if(!email) return '';
  const [local, dom] = (email || '').split('@');
  if(!local || !dom) return email;
  if(local.length <= 2) return '•'.repeat(local.length) + '@' + dom;
  const visible = Math.max(1, Math.floor(local.length * 0.25));
  return local.slice(0,visible) + '••••' + '@' + dom;
}

function safeGetQueryDomain() {
  if (typeof window === 'undefined') return null;
  try {
    const u = new URL(window.location.href);
    return (u.searchParams.get('domain') || '').trim().toLowerCase();
  } catch (e) {
    try {
      const params = new URLSearchParams(window.location.search || '');
      return (params.get('domain') || '').trim().toLowerCase();
    } catch {
      return null;
    }
  }
}

export default function HomePage() {
  const [domain, setDomain] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    const q = safeGetQueryDomain();
    if (q) loadDomain(q);
    else loadDomain('coca-cola.com'); // initial demo load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadDomain(d) {
    if (!d) return;
    const key = (d || '').trim().toLowerCase().replace(/^https?:\/\//,'').split('/')[0];
    setDomain(key);

    // Try server API first. If it fails, fallback to sample.
    try {
      const res = await fetch(`/api/find-company?domain=${encodeURIComponent(key)}`);
      if (res.ok) {
        const payload = await res.json();
        // payload: { domain, company, contacts, total, shown }
        const company = payload.company || {};
        company.contacts = payload.contacts || (payload.contacts || company.contacts) || [];
        company.total = payload.total || company.total || (company.contacts ? company.contacts.length : 0);
        company.shown = payload.shown || company.contacts.length || 0;

        // ensure each contact has _revealed flag
        company.contacts = (company.contacts || []).map(c => ({ ...c, _revealed: false }));
        setData(company);

        // update URL without reload
        try {
          const u = new URL(window.location.href);
          u.searchParams.set('domain', key);
          window.history.replaceState({}, '', u.toString());
        } catch {}
        return;
      }
    } catch (err) {
      console.warn('find-company API failed, using sample fallback', err?.message || err);
    }

    // fallback to SAMPLE if API not reachable
    const sample = SAMPLE[key];
    if (sample) setData({ ...sample, contacts: (sample.contacts || []).map(c => ({ ...c, _revealed: false })) });
    else setData(null);
  }

  // Render contacts: no initials column by default. If contact.photo exists, render it.
  function renderContacts(list) {
    if (!list || list.length === 0) return <div style={{ color:'#6b7280' }}>No contacts found yet.</div>;

    // group by department
    const groups = {};
    list.forEach(c => {
      const dept = (c.department || 'Other').trim() || 'Other';
      groups[dept] = groups[dept] || [];
      groups[dept].push(c);
    });

    return Object.keys(groups).map(dept => (
      <div key={dept} style={{ marginBottom:12 }}>
        <div style={{ fontWeight:700, marginBottom:8, textTransform:'capitalize' }}>{dept}</div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {groups[dept].map((p, idx) => (
            <div key={idx} style={{
              display:'grid',
              gridTemplateColumns: '1fr 220px 160px',
              alignItems:'center',
              padding:12,
              borderRadius:6,
              border:'1px solid #f1f5f9',
              background:'#fff'
            }}>
              {/* Name + email (no initials). If real photo present, show it at small size */}
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                { (p.photo || p.avatar || p.image) ? (
                  <img src={p.photo || p.avatar || p.image} alt={`${p.first_name} ${p.last_name}`} style={{ width:44,height:44,borderRadius:6,objectFit:'cover' }} />
                ) : null }

                <div style={{ display:'flex', flexDirection:'column' }}>
                  <div style={{ fontWeight:700 }}>{p.first_name} {p.last_name}</div>
                  <div style={{ fontFamily:'ui-monospace, Menlo, Monaco, monospace', fontStyle:'italic', color:'#0b1220' }}>
                    <span style={{ color:'#10b981', fontWeight:700, marginRight:8, fontSize:12 }}>Verified</span>
                    <span>{p._revealed ? p.email : maskEmail(p.email)}</span>
                  </div>
                </div>
              </div>

              <div style={{ color:'#6b7280' }}>{p.position}</div>

              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                <div style={{ color:'#6b7280', fontSize:14 }}>{p.department}</div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => {
                    const q = encodeURIComponent(`${p.first_name} ${p.last_name} ${domain} site:linkedin.com`);
                    window.open('https://www.google.com/search?q=' + q, '_blank');
                  }} style={{ padding:'6px 10px', borderRadius:6, border:'1px solid #e6edf3', background:'#fff', cursor:'pointer' }}>Source</button>

                  <button onClick={() => {
                    p._revealed = !p._revealed;
                    setData(prev => prev ? { ...prev, contacts: [...(prev.contacts || [])] } : prev);
                  }} style={{ padding:'6px 10px', borderRadius:6, border:'none', color:'#fff', fontWeight:700, cursor:'pointer', background: p._revealed ? '#ef4444' : '#10b981' }}>
                    {p._revealed ? 'Hide' : 'Reveal'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ));
  }

  // features with simple inline icons to match earlier illustrated style
  const FEATURES = [
    { icon: '👗', title: 'Model → Agency', text: 'Find modelling agencies and casting contacts to book your next shoot.' },
    { icon: '🎭', title: 'Actor → Agent', text: 'Locate talent agents and casting directors for auditions.' },
    { icon: '💼', title: 'Freelancer → Clients', text: 'Locate hiring managers and decision makers for contract work.' },
    { icon: '🎵', title: 'Musician → Gigs', text: 'Find booking agents, promoters, and venues to book shows.' },
    { icon: '🏷️', title: 'Seller → Leads', text: 'Discover sales contacts to scale your outreach and win that next contract.' },
    { icon: '📣', title: 'Influencer → Sponsors', text: 'Find brand contacts and PR reps to land sponsorships and collabs.' },
    { icon: '📸', title: 'Photographer → Clients', text: 'Find art directors, magazines, and brands who hire photographers.' },
    { icon: '📋', title: 'Event Planner → Vendors', text: 'Discover venue contacts, caterers, and vendor reps for events.' },
    { icon: '🚀', title: 'Founder → Investors', text: 'Locate investor relations, VCs, and angel contacts for fundraising.' }
  ];

  return (
    <ErrorBoundary>
      <main style={{ padding: '24px 20px', background:'#fbfcfd', minHeight:'100vh', fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <header style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:20 }}>
            <div style={{ maxWidth:760 }}>
              <h1 style={{ margin:'0 0 12px', fontSize:44, fontWeight:800, lineHeight:1, color:'#0a1724' }}>NovaHunt</h1>
              <p style={{ margin:'0 0 18px', color:'#6b7280', fontSize:16, lineHeight:1.45 }}>Find business emails instantly. Enter a company domain, and get professional email results.</p>

              <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:14 }}>
                <div style={{ flex:1, display:'flex', alignItems:'center', background:'#fff', borderRadius:8, border:'1px solid #e6edf3', padding:6 }}>
                  <input aria-label="domain" value={domain} onChange={e => setDomain(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') loadDomain(domain); }} placeholder="Enter domain, e.g. coca-cola.com" style={{ border:0, outline:0, padding:'12px 14px', fontSize:15, width:'100%', background:'transparent' }} />
                </div>

                <button onClick={() => loadDomain(domain)} style={{ background:'#2563eb', color:'#fff', border:'none', padding:'10px 14px', borderRadius:6, fontWeight:700, cursor:'pointer' }}>Search</button>
              </div>

              <div style={{ color:'#6b7280', fontSize:13 }}>
                <div>
                  { data ? (
                    <span>Showing {data.shown || (data.contacts && data.contacts.length) || 0} of {data.total || (data.contacts && data.contacts.length) || 0} results. </span>
                  ) : <span>Showing results</span> }

                  { /* upgrade link */ }
                  { data && data.total && data.total > (data.shown || (data.contacts && data.contacts.length) || 0) ? (
                    <Link href="/plans"><a style={{ marginLeft:10, color:'#2563eb', textDecoration:'underline', fontWeight:600 }}>Upgrade to see all</a></Link>
                  ) : null }
                </div>

                <div style={{ marginTop:8, display:'flex', gap:12, flexWrap:'wrap' }}>
                  {SAMPLE_DOMAINS.map(d => (<a key={d} href="#" onClick={(e)=>{e.preventDefault(); loadDomain(d);}} style={{ fontSize:13 }}>{d}</a>))}
                </div>
              </div>
            </div>

            <div style={{ alignSelf:'flex-start', fontSize:13 }}>
              <nav style={{ display:'flex', gap:12 }}>
                <Link href="/"><a style={{ textDecoration:'underline', color:'#2563eb' }}>Home</a></Link>
                <Link href="/plans"><a style={{ textDecoration:'underline', color:'#2563eb' }}>Plans</a></Link>
                <Link href="/about"><a style={{ textDecoration:'underline', color:'#2563eb' }}>About</a></Link>
                <Link href="/signin"><a style={{ textDecoration:'underline', color:'#2563eb' }}>SignIn</a></Link>
                <Link href="/signup"><a style={{ textDecoration:'underline', color:'#2563eb' }}>SignUp</a></Link>
              </nav>
            </div>
          </header>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:28, marginTop:24, alignItems:'start' }}>
            <section>
              <div style={{ background:'#fff', border:'1px solid #e6edf3', borderRadius:8, padding:18 }}>
                <div style={{ color:'#6b7280', fontSize:13, marginBottom:8 }}>Showing results</div>
                <div style={{ fontWeight:700, fontSize:18, marginBottom:12 }}>Contacts</div>

                <div>
                  { data ? renderContacts(data.contacts || []) : <div style={{ color:'#6b7280' }}>No sample data for that domain.</div> }
                </div>
              </div>

              <div style={{ marginTop:18, background:'#fff', border:'1px solid #e6edf3', borderRadius:8, padding:18 }}>
                <h3 style={{ marginTop:0 }}>How people use NovaHunt</h3>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginTop:6 }}>
                  {FEATURES.map((f, i) => (
                    <div key={i} style={{ border:'1px solid #e6edf3', borderRadius:8, padding:14, display:'flex', gap:12, alignItems:'flex-start' }}>
                      <div style={{ width:40,height:40,borderRadius:8,background:'#eef2ff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>{f.icon}</div>
                      <div>
                        <strong>{f.title}</strong>
                        <div style={{ color:'#6b7280', marginTop:6 }}>{f.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <aside>
              <RightPanel domain={domain} data={data} />
            </aside>
          </div>
        </div>
      </main>
    </ErrorBoundary>
  );
}
