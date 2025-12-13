import Head from 'next/head';
import { useEffect, useState } from 'react';

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

const SAMPLES = ["coca-cola.com","fordmodels.com","unitedtalent.com","wilhelmina.com","nfl.com"];
const FEATURES = [
  { title:"Model → Agency", text:"Find modelling agencies and casting contacts to book your next shoot." },
  { title:"Actor → Agent", text:"Locate talent agents and casting directors for auditions." },
  { title:"Freelancer → Clients", text:"Locate hiring managers and decision makers for contract work." },
  { title:"Musician → Gigs", text:"Find booking agents, promoters, and venues to book shows." },
  { title:"Seller → Leads", text:"Discover sales contacts to scale your outreach and win that next contract." },
  { title:"Influencer → Sponsors", text:"Find brand contacts and PR reps to land sponsorships and collabs." },
  { title:"Photographer → Clients", text:"Find art directors, magazines, and brands who hire photographers." },
  { title:"Event Planner → Vendors", text:"Discover venue contacts, caterers, and vendor reps for events." },
  { title:"Founder → Investors", text:"Locate investor relations, VCs, and angel contacts for fundraising." }
];

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

export default function Home() {
  const [domain, setDomain] = useState('coca-cola.com');
  const [data, setData] = useState(SAMPLE['coca-cola.com']);
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState(SAMPLE['coca-cola.com'].contacts);
  const [selectedDomain, setSelectedDomain] = useState('coca-cola.com');

  useEffect(() => {
    // initialize
    loadDomain('coca-cola.com');
    // set a model flag in localStorage similar to old behavior
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const cur = localStorage.getItem('nh_model');
        if (!cur) localStorage.setItem('nh_model', 'Copilot');
      }
    } catch (e) { /* ignore */ }
  }, []);

  function loadDomain(d) {
    const domainKey = (d || '').toLowerCase();
    setQuery('');
    setDomain(domainKey);
    setSelectedDomain(domainKey);
    const found = SAMPLE[domainKey];
    if (!found) {
      setData(null);
      setContacts([]);
    } else {
      // clone contacts so we can toggle reveal state locally
      const clone = found.contacts.map(c => ({ ...c, _revealed: false }));
      setData(found);
      setContacts(clone);
    }
  }

  function toggleReveal(idx) {
    setContacts(prev => {
      const next = prev.slice();
      next[idx] = { ...next[idx], _revealed: !next[idx]._revealed };
      return next;
    });
  }

  return (
    <>
      <Head>
        <title>NovaHunt — Demo (Coca-Cola)</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta charSet="utf-8" />
        <style>{`
:root{
  --bg: #ffffff;
  --page-bg: #fbfcfd;
  --card: #fff;
  --muted: #6b7280;
  --accent: #1e73d8;
  --accent-2: #2563eb;
  --panel-width: 320px;
  --gap: 28px;
  --max-width: 1100px;
  --border: #e6edf3;
  --verified: #10b981;
}

html,body{
  height:100%;
  margin:0;
  font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  background: var(--page-bg);
  color: #0f172a;
}

a { color: var(--accent-2); text-decoration: underline; }
button { font-family: inherit; }

.container {
  max-width: var(--max-width);
  margin: 24px auto;
  padding: 0 20px;
  box-sizing: border-box;
}

.header {
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap: 20px;
}

.brand { max-width: 760px; }

.brand h1 {
  margin: 0 0 12px 0;
  font-size: 44px;
  font-weight: 800;
  line-height: 1;
  color: #0a1724;
  letter-spacing: -0.6px;
}

.brand p {
  margin: 0 0 18px 0;
  color: var(--muted);
  font-size: 16px;
  line-height: 1.45;
}

.search-row { display:flex; align-items:center; gap: 12px; margin-bottom: 14px; }
.search-wrap { flex:1; display:flex; align-items:center; background: var(--card); border-radius:8px; border:1px solid var(--border); padding:6px; }
.search-wrap input { border:none; outline:none; padding:12px 14px; font-size:15px; width:100%; background:transparent; color:#0f172a; }
.search-btn { background:var(--accent-2); color:#fff; border:none; padding:10px 14px; border-radius:6px; font-weight:700; cursor:pointer; }

.top-nav { align-self:flex-start; font-size:13px; }
.top-nav a { margin-left:12px; color:var(--accent-2); text-decoration:underline; }

.main { display:grid; grid-template-columns: 1fr var(--panel-width); gap: var(--gap); margin-top:24px; align-items:start; }
.left { display:flex; flex-direction:column; gap:18px; }
.card { background:var(--card); border-radius:8px; border:1px solid var(--border); padding:18px; box-sizing:border-box; }
.contacts-title { font-weight:700; font-size:18px; margin:4px 0 12px 0; }
.contacts-list { display:flex; flex-direction:column; gap:12px; }
.contacts-row { display:grid; grid-template-columns: 1fr 2fr 160px; gap:12px; align-items:center; padding:12px; border-radius:6px; border:1px solid #f1f5f9; background:#fff; }
.contact-left { display:flex; gap:12px; align-items:flex-start; }
.avatar { width:44px; height:44; border-radius:6px; background:#eef2ff; display:flex; align-items:center; justify-content:center; font-weight:800; color:#0b1220; font-size:14px; }
.name { font-weight:700; font-size:15px; margin-bottom:4px; }
.email { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace; color:#0b1220; font-style:italic; font-size:13px; }
.email .masked { color:#0b1220; opacity:0.95; }
.email .verified { display:inline-block; margin-right:8px; color: var(--verified); font-weight:700; font-size:12px; }
.row-actions { display:flex; gap:8px; justify-self:end; align-items:center; }
.src-btn { padding:6px 10px; border-radius:6px; border:1px solid var(--border); background:#fff; cursor:pointer; font-size:13px; }
.reveal { padding:6px 10px; border-radius:6px; border:none; color:#fff; font-weight:700; cursor:pointer; font-size:13px; }
.reveal.show { background:#ef4444; }
.reveal.hide { background:var(--verified); }

.right { position:relative; width:100%; }
.company-logo { width:100%; height:180px; border-radius:10px; background:#fff; display:flex; align-items:center; justify-content:center; border:1px solid var(--border); box-sizing:border-box; overflow:hidden; }
.company-logo img { width:100%; height:100%; object-fit:cover; display:block; }

@media (max-width: 980px) {
  .main { grid-template-columns: 1fr; }
  .right { order: 2; }
}
        `}</style>
      </Head>

      <div className="container">
        <header className="header">
          <div className="brand">
            <h1>NovaHunt</h1>
            <p>Find business emails instantly. Enter a company domain, and get professional email results.</p>

            <div className="search-row" role="search" aria-label="Search by domain">
              <div className="search-wrap">
                <input
                  id="domainInput"
                  placeholder="Enter domain, e.g. coca-cola.com"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') loadDomain(query.trim()); }}
                />
              </div>
              <button
                id="searchBtn"
                className="search-btn"
                onClick={() => loadDomain(query.trim() || domain)}
              >
                Search
              </button>
            </div>

            <div className="test-ride">
              Want to take us for a test drive? Click any of these to see results live or enter your own search above.
              <div className="links" style={{ marginTop: 8 }}>
                {SAMPLES.map(s => (
                  <a key={s} href="#" onClick={(e)=>{ e.preventDefault(); loadDomain(s); }} style={{ marginRight: 10 }}>{s}</a>
                ))}
              </div>
            </div>
          </div>

          <div className="top-nav" aria-label="Top navigation">
            <a href="#">Home</a><a href="#">Plans</a><a href="#">About</a><a href="#">SignIn</a><a href="#">SignUp</a>
          </div>
        </header>

        <div className="main" role="main">
          <div className="left">
            <div className="card">
              <div className="results-meta" style={{ marginBottom: 8 }}>
                {contacts && contacts.length ? `Showing ${contacts.length} results` : 'Showing sample results'}
              </div>
              <div className="contacts-title">Contacts</div>
              <div className="contacts-list">
                {contacts && contacts.length ? contacts.map((c, i) => (
                  <div key={`${c.email}-${i}`} className="contacts-row">
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div className="avatar">{(c.first_name?.[0] || '') + (c.last_name?.[0] || '')}</div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="name">{c.first_name} {c.last_name}</div>
                        <div className="email">
                          <span className="verified">Verified</span>
                          <span className="masked" style={{ marginLeft: 8 }}>
                            {c._revealed ? c.email : maskEmail(c.email)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ color: 'var(--muted)', fontSize: 14 }}>{c.position}</div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                      <div style={{ color: 'var(--muted)', fontSize: 14 }}>{c.department}</div>
                      <div className="row-actions">
                        <button className="src-btn" onClick={()=>{
                          const q = encodeURIComponent(`${c.first_name} ${c.last_name} ${c.department} site:linkedin.com`);
                          window.open('https://www.google.com/search?q=' + q, '_blank');
                        }}>Source</button>
                        <button className={`reveal ${c._revealed ? 'show' : 'hide'}`} onClick={()=>toggleReveal(i)}>
                          {c._revealed ? 'Hide' : 'Reveal'}
                        </button>
                      </div>
                    </div>
                  </div>
                )) : <div style={{ color: 'var(--muted)' }}>No sample data for that domain.</div>}
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0 }}>How people use NovaHunt</h3>
              <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
                {FEATURES.map((f, i) => (
                  <div className="feature" key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 14, background: '#fff', display: 'flex', gap: 12 }}>
                    <div className="icon" style={{ width: 36, height: 36, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⭐</div>
                    <div>
                      <strong>{f.title}</strong>
                      <div style={{ color: 'var(--muted)', marginTop: 6 }}>{f.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="right">
            <div className="company-logo">
              <img src={data?.logo} alt={data?.name || 'Company'} />
            </div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginTop: 12 }}>
              <div className="company-title" style={{ fontWeight: 700, marginTop: 12, fontSize: 16 }}>
                {data?.name || 'Company Name'}
              </div>
              <div className="company-sub" style={{ color: 'var(--muted)' }}>Company summary</div>
              <dl className="fact-list" style={{ fontSize: 13, color: '#111827' }}>
                <dt>Date:</dt><dd id="factDate">{data?.facts?.Date}</dd>
                <dt>Ticker:</dt><dd id="factTicker">{data?.facts?.Ticker}</dd>
                <dt>Share Price:</dt><dd id="factPrice">{data?.facts?.Price}</dd>
                <dt>Market Cap:</dt><dd id="factMcap">{data?.facts?.MarketCap}</dd>
                <dt>Annual Revenue:</dt><dd id="factRevenue">{data?.facts?.Revenue}</dd>
                <dt>Sector:</dt><dd id="factSector">{data?.facts?.Sector}</dd>
                <dt>Industry:</dt><dd id="factIndustry">{data?.facts?.Industry}</dd>
                <dt>CEO:</dt><dd id="factCEO">{data?.facts?.CEO}</dd>
                <dt>Headquarters:</dt><dd id="factHQ"><a href="#">{data?.facts?.HQ}</a></dd>
              </dl>
            </div>

            <div className="right-illustration" style={{ marginTop: 12, border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
              <img alt="Decorative" src={data?.illustration} style={{ width: '100%', display: 'block' }} />
            </div>

            <div className="card" style={{ marginTop: 12 }}>
              <p style={{ marginTop: 0, color: 'var(--muted)' }}>
                The company summary above is sample content for the demo. Use "Search" or the sample links to load other demo domains.
              </p>
            </div>
          </aside>
        </div>

        <footer style={{ borderTop: '1px solid #eee', padding: '18px 0', marginTop: 32 }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 18px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <div style={{ color: '#666', fontSize: 13 }}>© 2026 NovaHunt.ai</div>
            <div style={{ color: '#666', fontSize: 13 }}> - </div>
            <div style={{ color: '#666', fontSize: 13 }}><a href="/contact" style={{ color: '#666', textDecoration: 'none' }}>Contact</a></div>
          </div>
        </footer>
      </div>
    </>
  );
}
