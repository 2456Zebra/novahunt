import Head from 'next/head';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Client-side DOM script adapted from your original index.html
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

    const samplesWrap = document.getElementById('sampleLinks');
    const contactsList = document.getElementById('contactsList');
    const resultsMeta = document.getElementById('resultsMeta');
    const companyLogo = document.getElementById('companyLogo');
    const companyName = document.getElementById('companyName');
    const companySummary = document.getElementById('companySummary') || {};
    const domainInput = document.getElementById('domainInput');
    const searchBtn = document.getElementById('searchBtn');
    const featuresGrid = document.getElementById('featuresGrid');

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

    // Build sample domain links
    if (samplesWrap) {
      samplesWrap.innerHTML = '';
      SAMPLES.forEach(d=>{
        const el = document.createElement('a');
        el.href = '#';
        el.textContent = d;
        el.style.marginRight = '10px';
        el.addEventListener('click', (ev)=>{
          ev.preventDefault();
          loadDomain(d);
        });
        samplesWrap.appendChild(el);
      });
    }

    // Build features
    if (featuresGrid) {
      featuresGrid.innerHTML = '';
      FEATURES.forEach(f=>{
        const node = document.createElement('div');
        node.className = 'feature';
        node.innerHTML = `<div class="icon">⭐</div><div><strong>${f.title}</strong><div style="color:var(--muted);margin-top:6px">${f.text}</div></div>`;
        featuresGrid.appendChild(node);
      });
    }

    function renderContacts(list){
      if (!contactsList || !resultsMeta) return;
      contactsList.innerHTML = '';
      if(!list || list.length === 0){
        resultsMeta.textContent = 'No contacts found yet.';
        return;
      }
      resultsMeta.textContent = `Showing ${list.length} results. Powered by AI`;

      const groups = {};
      list.forEach(c=>{
        const dept = (c.department || 'Other').toLowerCase();
        groups[dept] = groups[dept] || [];
        groups[dept].push(c);
      });

      Object.keys(groups).forEach(dept=>{
        const header = document.createElement('div');
        header.style.fontWeight = '700';
        header.style.marginTop = '6px';
        header.style.marginBottom = '6px';
        header.textContent = dept.charAt(0).toUpperCase() + dept.slice(1);
        contactsList.appendChild(header);

        groups[dept].forEach(contact=>{
          const row = document.createElement('div');
          row.className = 'contacts-row';

          const left = document.createElement('div');
          left.className = 'contact-left';
          left.style.gridColumn = '1 / 2';

          const avatar = document.createElement('div');
          avatar.className = 'avatar';
          const initials = (contact.first_name.charAt(0) + (contact.last_name.charAt(0)||'')).toUpperCase() || 'C';
          avatar.textContent = initials;

          const meta = document.createElement('div');
          meta.style.display = 'flex';
          meta.style.flexDirection = 'column';

          const nm = document.createElement('div');
          nm.className = 'name';
          nm.textContent = `${contact.first_name} ${contact.last_name}`;

          const em = document.createElement('div');
          em.className = 'email';
          em.innerHTML = `<span class="verified">Verified</span><span class="masked">${maskEmail(contact.email)}</span>`;

          meta.appendChild(nm);
          meta.appendChild(em);

          left.appendChild(avatar);
          left.appendChild(meta);

          const title = document.createElement('div');
          title.textContent = contact.position;
          title.style.color = 'var(--muted)';
          title.style.fontSize = '14px';

          const deptCell = document.createElement('div');
          deptCell.textContent = contact.department;
          deptCell.style.color = 'var(--muted)';
          deptCell.style.fontSize = '14px';

          const actions = document.createElement('div');
          actions.className = 'row-actions';

          const src = document.createElement('button');
          src.className = 'src-btn';
          src.textContent = 'Source';
          src.addEventListener('click', ()=>{
            const q = encodeURIComponent(`${contact.first_name} ${contact.last_name} ${contact.department} site:linkedin.com`);
            window.open('https://www.google.com/search?q=' + q, '_blank');
          });

          const reveal = document.createElement('button');
          reveal.className = 'reveal ' + (contact._revealed ? 'show' : 'hide');
          reveal.textContent = contact._revealed ? 'Hide' : 'Reveal';
          reveal.addEventListener('click', ()=>{
            contact._revealed = !contact._revealed;
            renderContacts(list);
          });

          actions.appendChild(src);
          actions.appendChild(reveal);

          row.appendChild(left);
          row.appendChild(title);
          row.appendChild(deptCell);

          const rightContainer = document.createElement('div');
          rightContainer.style.display = 'flex';
          rightContainer.style.flexDirection = 'column';
          rightContainer.style.alignItems = 'flex-end';
          rightContainer.style.gap = '6px';
          rightContainer.style.justifyContent = 'center';
          rightContainer.style.gridColumn = '3 / 4';

          rightContainer.appendChild(deptCell);
          rightContainer.appendChild(actions);

          // Adjust children similar to original script
          if (row.lastChild) row.removeChild(row.lastChild);
          row.appendChild(rightContainer);

          const emailSpan = em.querySelector('.masked');
          if (emailSpan) emailSpan.textContent = (contact._revealed ? contact.email : maskEmail(contact.email));
          reveal.className = 'reveal ' + (contact._revealed ? 'show' : 'hide');
          reveal.textContent = (contact._revealed ? 'Hide' : 'Reveal');

          contactsList.appendChild(row);
        });
      });
    }

    function loadDomain(domain){
      domain = (domain || '').toLowerCase();
      if(!domain) return;
      if (domainInput) domainInput.value = domain;
      const data = SAMPLE[domain] || null;
      if(!data){
        if (contactsList) contactsList.innerHTML = '<div style="color:var(--muted)">No sample data for that domain.</div>';
        if (resultsMeta) resultsMeta.textContent = 'No results';
        return;
      }

      if (companyLogo && companyLogo.querySelector) companyLogo.querySelector('img').src = data.logo;
      const logoImg = document.querySelector('#companyLogo img');
      if (logoImg) logoImg.alt = data.name;
      if (companyName) companyName.textContent = data.name;
      if (companySummary) companySummary.textContent = `${data.contacts.length} contacts found`;

      const setIf = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      setIf('factDate', data.facts.Date);
      setIf('factTicker', data.facts.Ticker);
      setIf('factPrice', data.facts.Price);
      setIf('factMcap', data.facts.MarketCap);
      setIf('factRevenue', data.facts.Revenue);
      setIf('factSector', data.facts.Sector);
      setIf('factIndustry', data.facts.Industry);
      setIf('factCEO', data.facts.CEO);
      const hqEl = document.getElementById('factHQ');
      if (hqEl) hqEl.innerHTML = `<a href="#">${data.facts.HQ}</a>`;

      data.contacts.forEach(c => { c._revealed = false; });
      renderContacts(data.contacts);
    }

    if (searchBtn) searchBtn.addEventListener('click', ()=> loadDomain(domainInput ? domainInput.value : ''));
    if (domainInput) domainInput.addEventListener('keydown', (e)=> { if(e.key === 'Enter') loadDomain(domainInput.value); });

    // Initialize
    loadDomain('coca-cola.com');

    // cleanup not necessary for this script, but return a function in case React unmounts
    return () => {};
  }, []);

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

/* page container */
.container {
  max-width: var(--max-width);
  margin: 24px auto;
  padding: 0 20px;
  box-sizing: border-box;
}

/* header area (top-left is NovaHunt & search) */
.header {
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap: 20px;
}

.brand {
  max-width: 760px;
}

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
  max-width: 760px;
}

/* big search row */
.search-row {
  display:flex;
  align-items:center;
  gap: 12px;
  margin-bottom: 14px;
}

.search-wrap {
  flex:1;
  display:flex;
  align-items:center;
  background: var(--card);
  border-radius: 8px;
  border: 1px solid var(--border);
  padding: 6px;
  box-sizing: border-box;
}

.search-wrap input {
  border: none;
  outline: none;
  padding: 12px 14px;
  font-size: 15px;
  width:100%;
  background: transparent;
  color: #0f172a;
}

.search-btn {
  background: var(--accent-2);
  color: #fff;
  border: none;
  padding: 10px 14px;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
}

.top-nav {
  align-self:flex-start;
  font-size:13px;
}

.top-nav a { margin-left:12px; color:var(--accent-2); text-decoration:underline; }

/* main grid */
.main {
  display:grid;
  grid-template-columns: 1fr var(--panel-width);
  gap: var(--gap);
  margin-top: 24px;
  align-items:start;
}

/* left column content */
.left {
  display:flex;
  flex-direction:column;
  gap: 18px;
}

.muted-small { color: var(--muted); font-size:13px; }

.test-ride {
  margin-top: 6px;
  font-size: 13px;
  color: var(--muted);
}
.test-ride .links { margin-top:8px; display:flex; gap:12px; flex-wrap:wrap; }
.test-ride a { font-size:13px; }

/* contacts card */
.card {
  background: var(--card);
  border-radius: 8px;
  border: 1px solid var(--border);
  padding: 18px;
  box-sizing: border-box;
}

.contacts-title {
  font-weight:700;
  font-size:18px;
  margin: 4px 0 12px 0;
}

/* table style list */
.contacts-list {
  width:100%;
  display:flex;
  flex-direction:column;
  gap:12px;
}

.contacts-row {
  display:grid;
  grid-template-columns: 1fr 2fr 160px;
  gap: 12px;
  align-items:center;
  padding: 12px;
  border-radius:6px;
  border: 1px solid #f1f5f9;
  background:#fff;
}

.contact-left { display:flex; gap:12px; align-items:flex-start; }
.avatar {
  width:44px;height:44;border-radius:6px;background:#eef2ff;display:flex;align-items:center;justify-content:center;font-weight:800;color:#0b1220;
  font-size:14px;
}
.name { font-weight:700; font-size:15px; margin-bottom:4px; }
.email { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace; color:#0b1220; font-style:italic; font-size:13px; }
.email .masked { color:#0b1220; opacity:0.95; }
.email .verified { display:inline-block; margin-right:8px; color: var(--verified); font-weight:700; font-size:12px }

.row-actions { display:flex; gap:8px; justify-self:end; align-items:center; }

.src-btn { padding:6px 10px; border-radius:6px; border:1px solid var(--border); background:#fff; cursor:pointer; font-size:13px; }
.reveal { padding:6px 10px; border-radius:6px; border:none; color:#fff; font-weight:700; cursor:pointer; font-size:13px;}
.reveal.show { background:#ef4444; }
.reveal.hide { background:var(--verified); }

.results-meta { font-size:13px; color:var(--muted); margin-bottom:8px; }

.features-grid {
  display:grid;
  grid-template-columns: repeat(2, 1fr);
  gap:12px;
  margin-top:6px;
}

.feature {
  border:1px solid var(--border);
  border-radius:8px;
  padding:14px;
  background:#fff;
  display:flex;
  gap:12px;
  align-items:flex-start;
  font-size:14px;
}

.feature .icon {
  width:36px;height:36;border-radius:8px;background:#eef2ff;display:flex;align-items:center;justify-content:center;
}

/* right column */
.right { position:relative; width:100%; }
.company-logo {
  width:100%;
  height:180px;
  border-radius:10px;
  background:#fff;
  display:flex;
  align-items:center;
  justify-content:center;
  border:1px solid var(--border);
  box-sizing:border-box;
  overflow:hidden;
}
.company-logo img { width:100%; height:100%; object-fit:cover; display:block; }

.company-title { font-weight:700; margin-top:12px; font-size:16px }
.company-sub { color:var(--muted); font-size:13px; margin-bottom:10px; }

.fact-list { font-size:13px; color:#111827; }
.fact-list dt { font-weight:700; margin-top:10px; }
.fact-list dd { margin:0 0 6px 0; color:var(--muted); }

.right-illustration { margin-top:12px; border:1px solid var(--border); border-radius:4px; overflow:hidden; }

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
                <input id="domainInput" placeholder="Enter domain, e.g. coca-cola.com" />
              </div>
              <button id="searchBtn" className="search-btn">Search</button>
            </div>

            <div className="test-ride">
              Want to take us for a test drive? Click any of these to see results live or enter your own search above.
              <div className="links" id="sampleLinks">
                {/* sample links injected by JS */}
              </div>
            </div>
          </div>

          <div className="top-nav" aria-label="Top navigation">
            <a href="#">Home</a>
            <a href="#">Plans</a>
            <a href="#">About</a>
            <a href="#">SignIn</a>
            <a href="#">SignUp</a>
          </div>
        </header>

        <div className="main" role="main">
          {/* LEFT COLUMN */}
          <div className="left">
            <div className="card">
              <div className="results-meta" id="resultsMeta">Showing sample results</div>
              <div className="contacts-title">Contacts</div>

              <div className="contacts-list" id="contactsList">
                {/* contact rows inserted by JS */}
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0 }}>How people use NovaHunt</h3>
              <div className="features-grid" id="featuresGrid">
                {/* features injected by JS */}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <aside className="right">
            <div className="company-logo" id="companyLogo">
              <img src="https://upload.wikimedia.org/wikipedia/commons/4/49/Coca-Cola_logo.png" alt="Company logo" />
            </div>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginTop: 12 }}>
              <div className="company-title" id="companyName">The Coca-Cola Company</div>
              <div className="company-sub">American company</div>

              <dl className="fact-list">
                <dt>Date:</dt><dd id="factDate">1892 - present</dd>
                <dt>Ticker:</dt><dd id="factTicker">KO</dd>
                <dt>Share Price:</dt><dd id="factPrice">$72.88 (mkt close)</dd>
                <dt>Market Cap:</dt><dd id="factMcap">$313.65 bil.</dd>
                <dt>Annual Revenue:</dt><dd id="factRevenue">$47.66 bil.</dd>
                <dt>Sector:</dt><dd id="factSector">Consumer Staples</dd>
                <dt>Industry:</dt><dd id="factIndustry">Beverages</dd>
                <dt>CEO:</dt><dd id="factCEO">Mr. James Robert B. Quincey</dd>
                <dt>Headquarters:</dt><dd id="factHQ"><a href="#">Atlanta</a></dd>
              </dl>
            </div>

            <div className="right-illustration" style={{ marginTop: 12, border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
              <img alt="Decorative" src="https://upload.wikimedia.org/wikipedia/commons/3/36/Coca-Cola-1898_ad.jpg" style={{ width: '100%', display: 'block' }} />
            </div>

            <div className="card" style={{ marginTop: 12 }}>
              <p style={{ marginTop: 0, color: 'var(--muted)' }}>The Coca-Cola Company is an American corporation founded in 1892 and today engaged primarily in the manufacture and sale of syrup and concentrate for Coca‑Cola, a sweetened carbonated beverage that is a cultural institution in the United States and a global symbol of American tastes. The company also produces and sells other soft drinks and citrus beverages. Headquarters: Atlanta, Georgia.</p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
