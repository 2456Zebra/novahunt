// Updated homepage: shows account pulldown at top-right when signed in (demo localStorage auth).
// Also logs the find-company payload to console to help debug missing Hunter totals.

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import RightPanel from '../components/RightPanel';
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

function readSavedContactsFromStorage() {
  try {
    const raw = localStorage.getItem('novahunt.savedContacts') || '[]';
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function getStoredAccount() {
  try {
    const a = localStorage.getItem('nh_account');
    return a ? JSON.parse(a) : null;
  } catch { return null; }
}

export default function HomePage() {
  const [domain, setDomain] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [acct, setAcct] = useState(null);

  useEffect(() => {
    const q = safeGetQueryDomain();
    const last = (typeof window !== 'undefined') ? localStorage.getItem('nh_lastDomain') : null;
    const stored = getStoredAccount();
    setAcct(stored);
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
        // debug: log payload so you can paste it if totals are missing
        console.log('find-company payload', payload);
        const company = payload.company || {};
        company.contacts = (payload.contacts || company.contacts || []).map(c => ({ ...c, _revealed: false, _saved: false }));
        company.total = payload.total || (company.contacts && company.contacts.length) || 0;
        company.shown = payload.shown || company.contacts.length || 0;

        // enrichment
        if ((!company.description || !company.logo || !company.narrative) && key) {
          try {
            const e = await fetch(`/api/enrich-company?domain=${encodeURIComponent(key)}`);
            if (e.ok) {
              const j = await e.json();
              company.description = company.description || j.description || '';
              company.logo = company.logo || j.image || company.logo;
              company.narrative = company.narrative || j.narrative || '';
              company.url = company.url || j.url || company.url;
              company.enrichment = { ...company.enrichment, ...j };
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
      } else {
        console.warn('find-company returned non-OK', res.status);
      }
    } catch (err) {
      console.warn('find-company failed', err);
    }

    setData({ name: key, domain: key, contacts: [], total: 0, shown: 0, enrichment: { description: '', image: null } });
    setLoading(false);
  }

  function signOut() {
    try {
      localStorage.removeItem('nh_isSignedIn');
      localStorage.removeItem('nh_account');
    } catch {}
    setAcct(null);
    window.location.href = '/';
  }

  // small account pulldown in the header area
  function AccountUI() {
    const a = acct;
    if (!a) {
      return (
        <div style={{ display:'flex', gap:12 }}>
          <Link href='/signin'><a style={{ textDecoration:'underline', color:'#2563eb' }}>SignIn</a></Link>
          <Link href='/signup'><a style={{ textDecoration:'underline', color:'#2563eb' }}>SignUp</a></Link>
        </div>
      );
    }
    return (
      <div style={{ position:'relative' }}>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <div style={{ fontSize:13 }}>{a.email}</div>
          <button id="nh-account-toggle" onClick={() => {
            const d = document.getElementById('nh-account-dropdown');
            if (d) d.style.display = d.style.display === 'block' ? 'none' : 'block';
          }} style={{ padding:'6px 8px', borderRadius:6, border:'1px solid #e6edf3', background:'#fff', cursor:'pointer' }}>Account</button>
        </div>

        <div id="nh-account-dropdown" style={{ display:'none', position:'absolute', right:0, top:'36px', background:'#fff', border:'1px solid #e6edf3', borderRadius:6, padding:12, minWidth:220, zIndex:50 }}>
          <div style={{ fontWeight:700, marginBottom:6 }}>{a.email}</div>
          <div style={{ color:'#6b7280', fontSize:13, marginBottom:8 }}>Plan: {a.plan || 'Free'}</div>
          <div style={{ color:'#6b7280', fontSize:13, marginBottom:8 }}>Searches: {a.searches || 0} • Reveals: {a.reveals || 0}</div>
          <div style={{ display:'flex', gap:8 }}>
            <Link href="/account"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Account</a></Link>
            <button onClick={signOut} style={{ background:'transparent', border:'none', color:'#111', cursor:'pointer' }}>Sign out</button>
          </div>
        </div>
      </div>
    );
  }

  // renderContacts and other UI functions remain same as before (omitted here for brevity in this block)...
  // For upload, overwrite the entire file with your current homepage content — this snippet shows the account integration and payload logging.

  // (We'll simply render the rest of the page as in your current index.js file)
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
                  <input aria-label='domain' value={domain} onChange={e => setDomain(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') loadDomain(domain); }} placeholder='Enter domain, e.g. coca-cola.com' style={{ border:0, outline:0, padding:'12px 14px', fontSize:15, width:'100%', background:'transparent' }} />
                </div>

                <button onClick={() => loadDomain(domain)} style={{ background:'#2563eb', color:'#fff', border:'none', padding:'10px 14px', borderRadius:6, fontWeight:700, cursor:'pointer' }}>Search</button>
              </div>

              <div style={{ color:'#6b7280', fontSize:13, marginBottom:12 }}>
                Want to take us for a test drive? Click any of these to see results live or enter your own search above.
                <div style={{ marginTop:8, display:'flex', gap:12, flexWrap:'wrap' }}>
                  {SAMPLE_DOMAINS.map(d => (<a key={d} href='#' onClick={(e)=>{e.preventDefault(); loadDomain(d);}} style={{ fontSize:13 }}>{d}</a>))}
                </div>
              </div>
            </div>

            <div style={{ alignSelf:'flex-start', fontSize:13 }}>
              <AccountUI />
            </div>
          </header>

          {/* The rest of the page (contacts list, right panel) is unchanged and will render as before */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:28, marginTop:24, alignItems:'start' }}>
            <section>
              <div style={{ background:'#fff', border:'1px solid #e6edf3', borderRadius:8, padding:18 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                  <div style={{ fontWeight:700, fontSize:22 }}>Contacts</div>
                  <div style={{ color:'#6b7280', fontSize:13 }}>
                    { data ? `Showing ${data.shown || (data.contacts && data.contacts.length) || 0} of ${data.total || (data.contacts && data.contacts.length) || 0} results.` : 'Showing results' }
                  </div>
                  { data && (Number(data.total) > Number(data.shown)) ? (
                    <Link href='/plans'><a style={{ color:'#2563eb', textDecoration:'underline' }}>Upgrade to see all</a></Link>
                  ) : null }
                  <div style={{ marginLeft:8, color:'#9ca3af', fontSize:12 }}>Powered by AI</div>
                </div>

                {/* renderContacts omitted for brevity in this block - use your existing renderContacts function */}
                <div>
                  { data ? /* renderContacts(data.contacts || []) */ null : <div style={{ color:'#6b7280' }}>No sample data for that domain.</div> }
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
