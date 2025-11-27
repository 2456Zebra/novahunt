import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import RightPanel from '../components/RightPanel';
import ErrorBoundary from '../components/ErrorBoundary';

// Standalone sample data (same as your demo HTML)
const SAMPLE = {
  "coca-cola.com": {
    name: "The Coca-Cola Company",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/49/Coca-Cola_logo.png",
    illustration: "https://upload.wikimedia.org/wikipedia/commons/3/36/Coca-Cola-1898_ad.jpg",
    facts: {
      Date: "1892 - present",
      Ticker: "KO",
      Price: "$72.88",
      MarketCap: "$313.65 bil.",
      Revenue: "$47.66 bil.",
      Sector: "Consumer Staples",
      Industry: "Beverages",
      CEO: "Mr. James Robert B. Quincey",
      HQ: "Atlanta"
    },
    contacts: [
      { first_name:"Ivy", last_name:"Crawford", position:"Senior Director, Execution", email:"ivy.crawford@coca-cola.com", department:"management", score:99 },
      { first_name:"Tiffany", last_name:"Stone", position:"Senior Director of Marketing", email:"tiffany.stone@coca-cola.com", department:"marketing", score:99 },
      { first_name:"Tina", last_name:"Gutierrez", position:"Director of Program Innovation", email:"tina.gutierrez@coca-cola.com", department:"management", score:99 },
      { first_name:"Mark", last_name:"Mitchell", position:"Director of Cloud Services", email:"mark.mitchell@coca-cola.com", department:"management", score:99 },
      { first_name:"Kimberly", last_name:"Burks", position:"Executive Assistant", email:"kimberly.burks@coca-cola.com", department:"operations", score:99 }
    ]
  }
};

const SAMPLE_DOMAINS = ["coca-cola.com","fordmodels.com","unitedtalent.com","wilhelmina.com","nfl.com"];

// Small utility functions
function maskEmail(email){
  if(!email) return '';
  const parts = email.split('@');
  const local = parts[0] || '';
  const domain = parts[1] || '';
  if(!local || !domain) return email;
  if(local.length <= 2) return '•'.repeat(local.length) + '@' + domain;
  const visible = Math.max(1, Math.floor(local.length * 0.25));
  return local.slice(0,visible) + '••••' + '@' + domain;
}

function safeGetQueryDomain() {
  if (typeof window === 'undefined') return null;
  try {
    const u = new URL(window.location.href);
    return (u.searchParams.get('domain') || '').trim().toLowerCase();
  } catch (e) {
    // fallback: parse location.search manually
    try {
      const qs = window.location.search || '';
      const params = new URLSearchParams(qs);
      return (params.get('domain') || '').trim().toLowerCase();
    } catch {
      return null;
    }
  }
}

export default function HomePage() {
  // start with an empty domain; we'll try to read query param on mount
  const [domain, setDomain] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    const q = safeGetQueryDomain();
    if (q) {
      loadDomain(q);
    } else {
      // optionally initialize with sample for preview
      loadDomain('coca-cola.com');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cloneData(src) {
    // shallow clone of object and contacts array to avoid mutating SAMPLE constant
    if (!src) return null;
    return {
      ...src,
      contacts: (src.contacts || []).map(c => ({ ...c, _revealed: false }))
    };
  }

  function loadDomain(d) {
    if (!d) return;
    const key = (d || '').trim().toLowerCase().replace(/^https?:\/\//,'').split('/')[0];
    setDomain(key);
    const found = SAMPLE[key] || null;
    if (found) {
      setData(cloneData(found));
      // update URL query param without full reload
      if (typeof window !== 'undefined') {
        try {
          const u = new URL(window.location.href);
          u.searchParams.set('domain', key);
          window.history.replaceState({}, '', u.toString());
        } catch {
          try {
            const base = window.location.pathname || '/';
            const qs = '?domain=' + encodeURIComponent(key);
            window.history.replaceState({}, '', base + qs);
          } catch {}
        }
      }
    } else {
      setData(null);
    }
  }

  function toggleReveal(contact) {
    contact._revealed = !contact._revealed;
    // force update by cloning data (simple pattern)
    setData(prev => prev ? { ...prev, contacts: [...prev.contacts] } : prev);
  }

  function renderContacts(list) {
    if (!list || list.length === 0) {
      return <div style={{ color: '#6b7280' }}>No contacts found yet.</div>;
    }

    // group by department
    const groups = {};
    list.forEach(c => {
      const dept = (c.department || 'Other').trim() || 'Other';
      groups[dept] = groups[dept] || [];
      groups[dept].push(c);
    });

    return Object.keys(groups).map((dept) => (
      <div key={dept} style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8, textTransform: 'capitalize' }}>{dept}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groups[dept].map((p, idx) => (
            <div key={idx} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 2fr 160px',
              gap: 12,
              alignItems: 'center',
              padding: 12,
              borderRadius: 6,
              border: '1px solid #f1f5f9',
              background: '#fff'
            }}>
              <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                <div style={{ width:44, height:44, borderRadius:6, background:'#eef2ff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800 }}>
                  {( (p.first_name||'').charAt(0) + (p.last_name||'').charAt(0) ).toUpperCase()}
                </div>
                <div style={{ display:'flex', flexDirection:'column' }}>
                  <div style={{ fontWeight:700 }}>{p.first_name} {p.last_name}</div>
                  <div style={{ fontFamily: 'ui-monospace, Menlo, Monaco, monospace', fontStyle:'italic', color:'#0b1220' }}>
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

                  <button onClick={() => toggleReveal(p)} style={{ padding:'6px 10px', borderRadius:6, border:'none', color:'#fff', fontWeight:700, cursor:'pointer', background: p._revealed ? '#ef4444' : '#10b981' }}>
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

  return (
    <ErrorBoundary>
      <main style={{ padding: '24px 20px', fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial', background: '#fbfcfd', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <header style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:20 }}>
            <div style={{ maxWidth:760 }}>
              <h1 style={{ margin:'0 0 12px', fontSize:44, fontWeight:800, lineHeight:1, color:'#0a1724' }}>NovaHunt</h1>
              <p style={{ margin:'0 0 18px', color:'#6b7280', fontSize:16, lineHeight:1.45 }}>Find business emails instantly. Enter a company domain, and get professional email results.</p>

              <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:14 }}>
                <div style={{ flex:1, display:'flex', alignItems:'center', background:'#fff', borderRadius:8, border:'1px solid #e6edf3', padding:6 }}>
                  <input
                    aria-label="domain"
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') loadDomain(domain); }}
                    placeholder="Enter domain, e.g. coca-cola.com"
                    style={{ border:0, outline:0, padding:'12px 14px', fontSize:15, width:'100%', background:'transparent' }}
                  />
                </div>

                <button onClick={() => loadDomain(domain)} style={{ background:'#2563eb', color:'#fff', border:'none', padding:'10px 14px', borderRadius:6, fontWeight:700, cursor:'pointer' }}>Search</button>
              </div>

              <div style={{ color:'#6b7280', fontSize:13 }}>
                Want to take us for a test drive? Click any of these to see results live or enter your own search above.
                <div style={{ marginTop:8, display:'flex', gap:12, flexWrap:'wrap' }}>
                  {SAMPLE_DOMAINS.map(d => (
                    <a key={d} href="#" onClick={(e)=>{e.preventDefault(); loadDomain(d);}} style={{ fontSize:13 }}>{d}</a>
                  ))}
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
                <div style={{ color:'#6b7280', fontSize:13, marginBottom:8 }}>Showing sample results</div>
                <div style={{ fontWeight:700, fontSize:18, marginBottom:12 }}>Contacts</div>

                <div>
                  {data ? renderContacts(data.contacts) : <div style={{ color:'#6b7280' }}>No sample data for that domain.</div>}
                </div>
              </div>

              <div style={{ marginTop:18, background:'#fff', border:'1px solid #e6edf3', borderRadius:8, padding:18 }}>
                <h3 style={{ marginTop:0 }}>How people use NovaHunt</h3>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginTop:6 }}>
                  <div style={{ border:'1px solid #e6edf3', borderRadius:8, padding:14 }}>
                    <strong>Model → Agency</strong>
                    <div style={{ color:'#6b7280', marginTop:6 }}>Find modelling agencies and casting contacts to book your next shoot.</div>
                  </div>
                  <div style={{ border:'1px solid #e6edf3', borderRadius:8, padding:14 }}>
                    <strong>Actor → Agent</strong>
                    <div style={{ color:'#6b7280', marginTop:6 }}>Locate talent agents and casting directors for auditions.</div>
                  </div>
                  <div style={{ border:'1px solid #e6edf3', borderRadius:8, padding:14 }}>
                    <strong>Freelancer → Clients</strong>
                    <div style={{ color:'#6b7280', marginTop:6 }}>Locate hiring managers and decision makers for contract work.</div>
                  </div>
                  <div style={{ border:'1px solid #e6edf3', borderRadius:8, padding:14 }}>
                    <strong>Musician → Gigs</strong>
                    <div style={{ color:'#6b7280', marginTop:6 }}>Find booking agents, promoters, and venues to book shows.</div>
                  </div>
                </div>
              </div>
            </section>

            <aside>
              <RightPanel domain={domain} data={data} onSelectDomain={loadDomain} />
            </aside>
          </div>
        </div>
      </main>
    </ErrorBoundary>
  );
}
