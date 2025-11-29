import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ErrorBoundary from '../components/ErrorBoundary';

const SAMPLE_DOMAINS = ['coca-cola.com','fordmodels.com','unitedtalent.com','wilhelmina.com','nfl.com'];

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

function userIsSignedIn() {
  if (typeof window === 'undefined') return false;
  try {
    if (localStorage.getItem('nh_isSignedIn') === '1') return true;
    if (document.cookie && /\bnh_token=/.test(document.cookie)) return true;
  } catch {}
  return false;
}

function readSavedContactsFromStorage() {
  try {
    const raw = localStorage.getItem('novahunt.savedContacts') || '[]';
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
function saveContactToStorage(contact) {
  try {
    const arr = readSavedContactsFromStorage();
    const exists = arr.find(c => c.email === contact.email);
    if (!exists) {
      arr.push({ ...contact, savedAt: Date.now() });
      localStorage.setItem('novahunt.savedContacts', JSON.stringify(arr));
    }
  } catch (e) { console.warn(e); }
}

export default function HomePage() {
  const [domain, setDomain] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = safeGetQueryDomain();
    const last = (typeof window !== 'undefined') ? localStorage.getItem('nh_lastDomain') : null;
    if (q) loadDomain(q);
    else if (last) loadDomain(last);
    else loadDomain('coca-cola.com');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadDomain(d) {
    if (!d) return;
    const key = (d || '').trim().toLowerCase().replace(/^https?:\/\//,'').split('/')[0];
    setDomain(key);
    setLoading(true);
    try { localStorage.setItem('nh_lastDomain', key); } catch {}

    try {
      const res = await fetch(`/api/find-company?domain=${encodeURIComponent(key)}`);
      if (res.ok) {
        const payload = await res.json();
        const company = payload.company || {};
        company.contacts = (payload.contacts || company.contacts || []).map(c => ({ ...c, _revealed: false, _saved: false }));
        company.total = payload.total || (company.contacts && company.contacts.length) || 0;
        company.shown = payload.shown || company.contacts.length || 0;

        // enrichment fallback (wikipedia -> KG -> OG/meta)
        if ((!company.description || !company.logo) && key) {
          try {
            const e = await fetch(`/api/enrich-company?domain=${encodeURIComponent(key)}`);
            if (e.ok) {
              const j = await e.json();
              company.description = company.description || j.description || '';
              company.logo = company.logo || j.image || company.logo;
              company.enrichment = { description: j.description || '', image: j.image || null, url: j.url || null, source: j.source || null };
            }
          } catch {}
        }

        const saved = readSavedContactsFromStorage();
        const savedEmails = new Set(saved.map(s => s.email));
        company.contacts = company.contacts.map(c => ({ ...c, _saved: savedEmails.has(c.email) }));

        setData(company);
        setLoading(false);
        try {
          const u = new URL(window.location.href);
          u.searchParams.set('domain', key);
          window.history.replaceState({}, '', u.toString());
        } catch {}
        return;
      }
    } catch (err) {
      console.warn('find-company failed', err);
    }

    setData({ name: key, domain: key, contacts: [], total: 0, shown: 0, enrichment: { description: '', image: null } });
    setLoading(false);
  }

  // Save contact: called after reveal; persists to localStorage and calls demo API
  async function saveContact(contact, idx) {
    try {
      saveContactToStorage(contact);
      setData(prev => {
        const clone = { ...(prev || {}), contacts: [...(prev?.contacts || [])] };
        clone.contacts[idx] = { ...clone.contacts[idx], _saved: true };
        return clone;
      });
      try {
        await fetch('/api/save-contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contact })
        });
      } catch {}
    } catch (err) {
      console.error('saveContact failed', err);
      alert('Save failed');
    }
  }

  // Reveal behavior: if not signed in -> /plans; if signed in -> reveal permanently
  function handleReveal(idx) {
    const signedIn = userIsSignedIn();
    if (!signedIn) {
      try { localStorage.setItem('nh_lastDomain', domain); } catch {}
      window.location.href = '/plans';
      return;
    }
    setData(prev => {
      const clone = { ...(prev || {}), contacts: [...(prev?.contacts || [])] };
      clone.contacts[idx] = { ...clone.contacts[idx], _revealed: true };
      return clone;
    });
  }

  function renderContacts(list) {
    if (!list || list.length === 0) return <div style={{ color:'#6b7280' }}>No contacts found yet.</div>;

    const groups = {};
    list.forEach((c, i) => {
      const dept = (c.department || 'Other').trim() || 'Other';
      groups[dept] = groups[dept] || [];
      groups[dept].push({ ...c, _index: i });
    });

    return Object.keys(groups).map(dept => (
      <div key={dept} style={{ marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8 }}>
          <div style={{ fontWeight:700, textTransform:'capitalize', fontSize:15 }}>{dept} <span style={{ color:'#6b7280', fontSize:13, marginLeft:8 }}>({groups[dept].length})</span></div>
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
                  {confidence !== null ? (
                    <div style={{ minWidth:36, textAlign:'center', fontSize:12, fontWeight:700, color: confidence > 70 ? '#065f46' : '#92400e' }}>
                      {confidence}%
                    </div>
                  ) : null}

                  <div style={{ display:'flex', flexDirection:'column' }}>
                    <div style={{ fontWeight:500 }}>{p.first_name} {p.last_name}</div>
                    <div style={{ fontFamily:'ui-monospace, Menlo, Monaco, monospace', fontStyle:'italic', color:'#0b1220' }}>
                      <span style={{ color:'#10b981', fontWeight:700, marginRight:8, fontSize:12 }}>Verified</span>
                      <span>{p._revealed ? p.email : maskEmail(p.email)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ color:'#6b7280' }}>{p.position}</div>

                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                  <div style={{ color:'#6b7280', fontSize:14 }}>{p.department}</div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <a onClick={() => {
                      const q = encodeURIComponent(`${p.first_name} ${p.last_name} ${domain} site:linkedin.com`);
                      window.open('https://www.google.com/search?q=' + q, '_blank');
                    }} style={{ fontSize:12, color:'#6b7280', textTransform:'lowercase', cursor:'pointer', textDecoration:'none' }}>source</a>

                    <button onClick={() => handleReveal(idx)} style={{ padding:'6px 8px', borderRadius:6, border:'none', color:'#fff', fontWeight:700, cursor:'pointer', background: '#2563eb' }}>
                      Reveal
                    </button>

                    { p._revealed ? (
                      <button onClick={() => saveContact(p, idx)} disabled={p._saved} style={{ padding:'6px 10px', borderRadius:6, border:'none', color:'#fff', fontWeight:700, cursor:'pointer', background: '#10b981' }}>
                        {p._saved ? 'Saved' : 'Save'}
                      </button>
                    ) : null }
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
              <h1 style={{ margin:'0 0 12px', fontSize:48, fontWeight:800, lineHeight:1, color:'#0a1724' }}>NovaHunt</h1>
              <p style={{ margin:'0 0 18px', color:'#6b7280', fontSize:17, lineHeight:1.45 }}>Find business emails instantly. Enter a company domain, and get professional email results.</p>

              <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:14 }}>
                <div style={{ flex:1, display:'flex', alignItems:'center', background:'#fff', borderRadius:8, border:'1px solid #e6edf3', padding:6 }}>
                  <input aria-label="domain" value={domain} onChange={e => setDomain(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') loadDomain(domain); }} placeholder="Enter domain, e.g. coca-cola.com" style={{ border:'none', outline:'none', padding:'8px 10px', width:'100%' }} />
                </div>

                <button onClick={() => loadDomain(domain)} style={{ background:'#2563eb', color:'#fff', border:'none', padding:'10px 14px', borderRadius:6, fontWeight:700, cursor:'pointer' }}>Search</button>
              </div>

              <div style={{ color:'#6b7280', fontSize:13, marginBottom:12 }}>
                Want to take us for a test drive? Click any of these to see results live or enter your own search above.
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
                <Link href="/plans"><a style={{ textDecoration:'underline', color:'#2563eb' }}>SignUp</a></Link>
              </nav>
            </div>
          </header>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:28, marginTop:24, alignItems:'start' }}>
            <section>
              <div style={{ background:'#fff', border:'1px solid #e6edf3', borderRadius:8, padding:18 }}>
                {/* Inline Contacts header + meta inside the card */}
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                  <div style={{ fontWeight:700, fontSize:22 }}>Contacts</div>

                  <div style={{ color:'#6b7280', fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
                    { data ? (
                      <>
                        <span>
                          Showing {data.shown || (data.contacts && data.contacts.length) || 0} of {data.total || (data.contacts && data.contacts.length) || 0} results.
                        </span>

                        <Link href="/plans">
                          <a style={{ color:'#ff6b00', textDecoration:'underline', marginLeft:6 }}>Upgrade to see all</a>
                        </Link>
                      </>
                    ) : <span>Showing results</span> }
                  </div>

                  <div style={{ marginLeft:8, color:'#9ca3af', fontSize:12 }}>Powered by AI</div>
                </div>

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

            {/* RightPanel removed here to avoid duplication — Layout renders the RightPanel */}
          </div>
        </div>
      </main>
    </ErrorBoundary>
  );
}
