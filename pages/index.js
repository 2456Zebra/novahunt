import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import RightPanel from '../components/RightPanel';
import ErrorBoundary from '../components/ErrorBoundary';

const SAMPLE_DOMAINS = ["coca-cola.com","fordmodels.com","unitedtalent.com","wilhelmina.com","nfl.com"];

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
  } catch {
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = safeGetQueryDomain();
    if (q) loadDomain(q);
    else loadDomain('coca-cola.com');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadDomain(d) {
    if (!d) return;
    const key = (d || '').trim().toLowerCase().replace(/^https?:\/\//,'').split('/')[0];
    setDomain(key);
    setLoading(true);

    try {
      const res = await fetch(`/api/find-company?domain=${encodeURIComponent(key)}`);
      if (res.ok) {
        const payload = await res.json();
        const company = payload.company || {};
        company.contacts = payload.contacts || [];
        company.total = payload.total || company.total || (company.contacts.length || 0);
        company.shown = payload.shown || company.contacts.length || 0;
        company.enrichment = { description: company.description || '', image: company.logo || null };

        // If no description/image present, try the free enrichment fallback
        if ((!company.enrichment.description || !company.enrichment.image) && key) {
          try {
            const e = await fetch(`/api/enrich-company?domain=${encodeURIComponent(key)}`).then(r => r.ok ? r.json() : {});
            if (e && e.description) company.enrichment.description = company.enrichment.description || e.description;
            if (e && e.image) company.enrichment.image = company.enrichment.image || e.image;
          } catch {}
        }

        // ensure _revealed and _saved flags
        company.contacts = (company.contacts || []).map(c => ({ ...c, _revealed: false, _saved: false }));
        setData(company);
        try {
          const u = new URL(window.location.href);
          u.searchParams.set('domain', key);
          window.history.replaceState({}, '', u.toString());
        } catch {}
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('find-company failed', err);
    }

    // fallback: create a minimal sample
    setData({
      name: key,
      domain: key,
      contacts: [],
      total: 0,
      shown: 0,
      enrichment: { description: '', image: null }
    });
    setLoading(false);
  }

  // Save contact -> POST to /api/save-contact
  async function saveContact(contact, idx) {
    try {
      const r = await fetch('/api/save-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact })
      });
      const j = await r.json();
      if (r.ok && j.ok) {
        // set _saved on that contact instance
        setData(prev => {
          const clone = { ...prev, contacts: [...(prev.contacts || [])] };
          clone.contacts[idx] = { ...clone.contacts[idx], _saved: true };
          return clone;
        });
      } else {
        alert(j.error || 'Save failed');
      }
    } catch (err) {
      console.error(err);
      alert('Save failed');
    }
  }

  // Render contacts: display confidence %, department counts, Save button (instead of Hide)
  function renderContacts(list) {
    if (!list || list.length === 0) return <div style={{ color:'#6b7280' }}>No contacts found yet.</div>;

    // group by department with counts
    const groups = {};
    list.forEach((c, i) => {
      const dept = (c.department || 'Other').trim() || 'Other';
      groups[dept] = groups[dept] || [];
      groups[dept].push({ ...c, _index: i });
    });

    return Object.keys(groups).map(dept => (
      <div key={dept} style={{ marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8 }}>
          <div style={{ fontWeight:700, textTransform:'capitalize' }}>{dept}</div>
          <div style={{ color:'#6b7280', fontSize:13 }}>{groups[dept].length} people</div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {groups[dept].map((pwr) => {
            const p = pwr;
            const idx = p._index;
            const confidence = (p.score !== undefined && p.score !== null) ? Math.round(Number(p.score)) : null;
            return (
              <div key={idx} style={{
                display:'grid',
                gridTemplateColumns: '1fr 220px 160px',
                alignItems:'center',
                padding:12,
                borderRadius:6,
                border:'1px solid #f1f5f9',
                background:'#fff'
              }}>
                <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                  {/* optional small confidence badge */}
                  {confidence !== null ? (
                    <div style={{ minWidth:36, textAlign:'center', fontSize:12, fontWeight:700, color: confidence > 70 ? '#065f46' : '#92400e' }}>
                      {confidence}%
                    </div>
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

                    <button onClick={() => saveContact(p, idx)} disabled={p._saved} style={{ padding:'6px 10px', borderRadius:6, border:'none', color:'#fff', fontWeight:700, cursor:'pointer', background: p._saved ? '#4b5563' : '#2563eb' }}>
                      {p._saved ? 'Saved' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ));
  }

  const FEATURES = [
    { icon: '👗', title: 'Model → Agency', text: 'Find modelling agencies and casting contacts to book your next shoot.' },
    { icon: '🎭', title: 'Actor → Agent', text: 'Locate talent agents and casting directors for auditions.' },
    { icon: '💼', title: 'Freelancer → Clients', text: 'Locate hiring managers and decision makers for contract work.' },
    { icon: '🎵', title: 'Musician → Gigs', text: 'Find booking agents, promoters, and venues to book shows.' }
  ];

  return (
    <ErrorBoundary>
      <main style={{ padding: '24px 20px', background:'#fbfcfd', minHeight:'100vh', fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <header style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:20 }}>
            <div style={{ maxWidth:760 }}>
              <h1 style={{ margin:'0 0 12px', fontSize:48, fontWeight:800, lineHeight:1, color:'#0a1724' }}>NovaHunt</h1>
              <p style={{ margin:'0 0 18px', color:'#6b7280', fontSize:17, lineHeight:1.45 }}>Find business emails instantly. Enter a company domain, and get professional email results.</p>

              <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:14 }}>
                <div style={{ flex:1, display:'flex', alignItems:'center', background:'#fff', borderRadius:8, border:'1px solid #e6edf3', padding:6 }}>
                  <input aria-label="domain" value={domain} onChange={e => setDomain(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') loadDomain(domain); }} placeholder="Enter domain, e.g. coca-cola.com" style={{ border:0, outline:0, padding:'12px 14px', fontSize:15, width:'100%', background:'transparent' }} />
                </div>

                <button onClick={() => loadDomain(domain)} style={{ background:'#2563eb', color:'#fff', border:'none', padding:'10px 14px', borderRadius:6, fontWeight:700, cursor:'pointer' }}>Search</button>
              </div>

              {/* Test drive (restored) */}
              <div style={{ color:'#6b7280', fontSize:13, marginBottom:12 }}>
                Want to take us for a test drive? Click any of these to see results live or enter your own search above.
                <div style={{ marginTop:8, display:'flex', gap:12, flexWrap:'wrap' }}>
                  {SAMPLE_DOMAINS.map(d => (<a key={d} href="#" onClick={(e)=>{e.preventDefault(); loadDomain(d);}} style={{ fontSize:13 }}>{d}</a>))}
                </div>
              </div>

              {/* Results meta: shows "Showing 10 of 444" and Upgrade CTA */}
              <div style={{ color:'#6b7280', fontSize:13, marginBottom:10 }}>
                { data ? (
                  <div>
                    <strong>Showing {data.shown || (data.contacts && data.contacts.length) || 0} of {data.total || (data.contacts && data.contacts.length) || 0} results.</strong>
                    { data && data.total && data.total > (data.shown || (data.contacts && data.contacts.length) || 0) ? (
                      <Link href="/plans"><a style={{ marginLeft:12, color:'#2563eb', textDecoration:'underline', fontWeight:600 }}>Upgrade to see all</a></Link>
                    ) : null }
                  </div>
                ) : <div>Showing results</div> }
              </div>
            </div>

            <div style={{ alignSelf:'flex-start', fontSize:13 }}>
              <nav style={{ display:'flex', gap:12 }}>
                <Link href="/"><a style={{ textDecoration:'underline', color:'#2563eb' }}>Home</a></Link>
                <Link href="/plans"><a style={{ textDecoration:'underline', color:'#2563eb' }}>Plans</a></Link>
                <Link href="/about"><a style={{ textDecoration:'underline', color:'#2563eb' }}>About</a></Link>
                <Link href="/signin"><a style={{ textDecoration:'underline', color:'#2563eb' }}>SignIn</a></Link>
                <Link href="/plans"><a style={{ textDecoration:'underline', color:'#2563eb' }}>SignUp</a></Link>
              </nav>
            </div>
          </header>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:28, marginTop:24, alignItems:'start' }}>
            <section>
              <div style={{ background:'#fff', border:'1px solid #e6edf3', borderRadius:8, padding:18 }}>
                <div style={{ fontWeight:700, fontSize:20, marginBottom:12 }}>Contacts</div>
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
