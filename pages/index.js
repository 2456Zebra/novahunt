// pages/index.js
// Homepage with SignUp link updated to go to /plans

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import RightPanel from '../components/RightPanel';
import ErrorBoundary from '../components/ErrorBoundary';
import {
  getClientEmail,
  canReveal,
  incrementReveal,
  recordReveal,
  canSearch,
  incrementSearch,
} from '../lib/auth-client';

const SAMPLE_DOMAINS = ['coca-cola.com', 'fordmodels.com', 'unitedtalent.com', 'wilhelmina.com', 'nfl.com'];

/* ----- helpers ----- */
function maskEmail(email) {
  if (!email) return '';
  const [local, dom] = String(email).split('@');
  if (!local || !dom) return email;
  if (local.length <= 2) return '•'.repeat(local.length) + '@' + dom;
  const visible = Math.max(1, Math.floor(local.length * 0.25));
  return local.slice(0, visible) + '••••' + '@' + dom;
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

// increment a search only once per domain per session
function incrementSearchOnceForDomain(domain) {
  try {
    if (!domain) return false;
    const last = sessionStorage.getItem('nh_last_counted_search') || '';
    if (last === domain) return false; // already counted this session
    if (!canSearch()) {
      try { window.dispatchEvent(new CustomEvent('nh_limit_reached', { detail: { type: 'search' } })); } catch (e) {}
      return false;
    }
    const updated = incrementSearch();
    if (updated) {
      sessionStorage.setItem('nh_last_counted_search', domain);
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

export default function HomePage() {
  const [domain, setDomain] = useState('');
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Auto-run on mount from ?domain or lastDomain, but DO NOT count these auto searches
    const q = safeGetQueryDomain();
    const last = (typeof window !== 'undefined') ? localStorage.getItem('nh_lastDomain') : null;
    if (q) loadDomain(q, { count: false, auto: true });
    else if (last) loadDomain(last, { count: false, auto: true });
    else loadDomain('coca-cola.com', { count: false, auto: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // loadDomain(d, {count:true|false, auto:true|false})
  async function loadDomain(d, { count = true, auto = false } = {}) {
    if (!d) return;
    const key = (d || '').trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];

    // If caller asked to count a search, enforce the search limit first.
    if (count && !canSearch()) {
      try { window.dispatchEvent(new CustomEvent('nh_limit_reached', { detail: { type: 'search' } })); } catch (e) {}
      return;
    }

    setDomain(key);
    setLoading(true);
    try { localStorage.setItem('nh_lastDomain', key); } catch (e) {}

    try {
      // Always use /api/find-company so Hunter + enrichment are returned by the server
      // Add nocache=1 for first load only when the session hasn't fetched this domain yet
      const nocacheFlag = sessionStorage.getItem(`nh_no_cache_${key}`) ? '' : '&nocache=1';
      if (!sessionStorage.getItem(`nh_no_cache_${key}`)) sessionStorage.setItem(`nh_no_cache_${key}`, '1');

      const res = await fetch(`/api/find-company?domain=${encodeURIComponent(key)}${nocacheFlag}`, { credentials: 'same-origin' });
      if (!res.ok) {
        console.warn('find-company fetch failed', res.status);
        const fallback = { name: key, domain: key, contacts: [], total: 0, shown: 0, enrichment: { description: '', image: null } };
        try { localStorage.setItem('nh_company', JSON.stringify(fallback)); } catch (e) {}
        setCompany(fallback);
        setLoading(false);
        return;
      }

      const payload = await res.json();

      // Defensive client-side fallback:
      // Use payload.contacts if present; otherwise, if payload.hunter_raw.json.data.emails exists, map those into contacts.
      let contacts = Array.isArray(payload.contacts) ? payload.contacts : (Array.isArray(payload.company && payload.company.contacts) ? payload.company.contacts : []);
      const hunterEmails = payload && payload.hunter_raw && payload.hunter_raw.json && payload.hunter_raw.json.data && Array.isArray(payload.hunter_raw.json.data.emails)
        ? payload.hunter_raw.json.data.emails
        : null;

      if ((!contacts || contacts.length === 0) && hunterEmails && hunterEmails.length) {
        contacts = hunterEmails.map(e => ({
          first_name: e.first_name || '',
          last_name: e.last_name || '',
          email: e.value || e.email || '',
          position: e.position || e.position_raw || '',
          score: (e.confidence !== undefined && e.confidence !== null) ? Number(e.confidence) : (e.score !== undefined ? Number(e.score) : null),
          department: e.department || '',
          linkedin: e.linkedin || null,
        })).filter(c => c.email && c.email.includes('@'));
      }

      // Normalize company shape
      const c = (payload && payload.company) ? { ...payload.company } : { name: key, domain: key };
      c.contacts = contacts.map(ct => ({ ...ct, _revealed: false, _saved: false }));
      c.total = typeof payload.total === 'number' ? payload.total : (typeof c.total === 'number' ? c.total : (c.contacts && c.contacts.length) || 0);
      c.shown = typeof payload.shown === 'number' ? payload.shown : (c.contacts && c.contacts.length) || 0;
      c.description = c.description || (c.enrichment && c.enrichment.description) || '';
      c.logo = c.logo || (c.enrichment && c.enrichment.image) || c.logo || null;

      // Merge saved state from localStorage
      try {
        const savedRaw = localStorage.getItem('novahunt.savedContacts') || '[]';
        const saved = JSON.parse(savedRaw);
        const savedEmails = new Set((saved || []).map(s => s.email));
        c.contacts = c.contacts.map(ct => ({ ...ct, _saved: savedEmails.has(ct.email) }));
      } catch (err) {
        // ignore
      }

      // Persist company for RightPanel
      try { localStorage.setItem('nh_company', JSON.stringify(c)); } catch (err) {}

      setCompany(c);
      setLoading(false);

      // Only increment search count when explicitly requested (count === true),
      // and guard double counting in same session
      if (count) incrementSearchOnceForDomain(key);

      // Update URL querystring (no reload)
      try {
        const u = new URL(window.location.href);
        u.searchParams.set('domain', key);
        window.history.replaceState({}, '', u.toString());
      } catch (e) {}

      return;
    } catch (err) {
      console.warn('find-company failed', err);
      const fallback = { name: key, domain: key, contacts: [], total: 0, shown: 0, enrichment: { description: '', image: null } };
      try { localStorage.setItem('nh_company', JSON.stringify(fallback)); } catch (e) {}
      setCompany(fallback);
      setLoading(false);
    }
  }

  // Save contact: persists locally and calls API (best-effort)
  async function saveContact(contact, idx) {
    try {
      const raw = localStorage.getItem('novahunt.savedContacts') || '[]';
      const arr = JSON.parse(raw);
      const exists = arr.find(c => c.email === contact.email);
      if (!exists) {
        arr.push({ ...contact, savedAt: Date.now() });
        localStorage.setItem('novahunt.savedContacts', JSON.stringify(arr));
      }
      setCompany(prev => {
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
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error('saveContact failed', err);
      alert('Save failed');
    }
  }

  // Handle reveal from inline contacts
  function handleReveal(idx) {
    // anonymous users must go to Plans immediately
    const email = getClientEmail();
    if (!email) {
      try { localStorage.setItem('nh_lastDomain', domain); } catch (e) {}
      window.location.href = '/plans';
      return;
    }

    // check canReveal before doing anything
    if (!canReveal()) {
      try { window.dispatchEvent(new CustomEvent('nh_limit_reached', { detail: { type: 'reveal' } })); } catch (e) {}
      return;
    }

    // mark revealed in UI
    setCompany(prev => {
      const clone = { ...(prev || {}), contacts: [...(prev?.contacts || [])] };
      clone.contacts[idx] = { ...clone.contacts[idx], _revealed: true };
      return clone;
    });

    // increment reveal and record history; incrementReveal returns null if at limit
    try {
      const updated = incrementReveal();
      if (!updated) {
        try { window.dispatchEvent(new CustomEvent('nh_limit_reached', { detail: { type: 'reveal' } })); } catch (e) {}
      } else {
        const target = (company && company.contacts && company.contacts[idx]) ? company.contacts[idx].email || `${idx}` : `${idx}`;
        try { recordReveal({ target, date: new Date().toISOString(), note: 'client-side reveal' }); } catch (e) {}
      }
    } catch (e) {
      // ignore local increment errors
    }

    // best-effort persist to server
    (async () => {
      try {
        await fetch('/api/reveal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target: company?.contacts?.[idx]?.email || `${idx}` }),
          credentials: 'include',
        });
      } catch (e) {
        // ignore
      }
    })();
  }

  function renderContacts(list) {
    if (!list || list.length === 0) {
      if (company && company.total && company.total > 0) {
        return <div style={{ color: '#6b7280' }}>Showing {company.shown || (company.contacts && company.contacts.length) || 0} sample results — upgrade to see all (server reports {company.total}).</div>;
      }
      return <div style={{ color: '#6b7280' }}>No contacts found yet.</div>;
    }

    const groups = {};
    list.forEach((c, i) => {
      const dept = (c.department || 'Other').trim() || 'Other';
      groups[dept] = groups[dept] || [];
      groups[dept].push({ ...c, _index: i });
    });

    return Object.keys(groups).map(dept => (
      <div key={dept} style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <div style={{ fontWeight: 700, textTransform: 'capitalize', fontSize: 15 }}>
            {dept} <span style={{ color: '#6b7280', fontSize: 13, marginLeft: 8 }}>({groups[dept].length})</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groups[dept].map((pwr) => {
            const p = pwr;
            const idx = p._index;
            const confidence = (p.score !== undefined && p.score !== null) ? Math.round(Number(p.score)) : null;
            return (
              <div key={idx} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 220px 160px',
                alignItems: 'center',
                padding: 12,
                borderRadius: 6,
                border: '1px solid #f1f5f9',
                background: '#fff'
              }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {confidence !== null ? (
                    <div style={{ minWidth: 36, textAlign: 'center', fontSize: 12, fontWeight: 700, color: confidence > 70 ? '#065f46' : '#92400e' }}>
                      {confidence}%
                    </div>
                  ) : null}

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontWeight: 500 }}>{p.first_name} {p.last_name}</div>
                    <div style={{ fontFamily: 'ui-monospace, Menlo, Monaco, monospace', fontStyle: 'italic', color: '#0b1220' }}>
                      <span style={{ color: '#10b981', fontWeight: 700, marginRight: 8, fontSize: 12 }}>Verified</span>
                      <span>{p._revealed ? p.email : maskEmail(p.email)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ color: '#6b7280' }}>{p.position}</div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <div style={{ color: '#6b7280', fontSize: 14 }}>{p.department}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <a onClick={() => {
                      const q = encodeURIComponent(`${p.first_name} ${p.last_name} ${domain} site:linkedin.com`);
                      window.open('https://www.google.com/search?q=' + q, '_blank');
                    }} style={{ fontSize: 12, color: '#6b7280', textTransform: 'lowercase', cursor: 'pointer', textDecoration: 'none' }}>source</a>

                    <button onClick={() => handleReveal(idx)} style={{ padding: '6px 8px', borderRadius: 6, border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', background: '#2563eb' }}>
                      Reveal
                    </button>

                    {p._revealed ? (
                      <button onClick={() => saveContact(p, idx)} disabled={p._saved} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', background: '#059669' }}>
                        {p._saved ? 'Saved' : 'Save'}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ));
  }

  return (
    <ErrorBoundary>
      <main style={{ padding: '24px 20px', background: '#fbfcfd', minHeight: '100vh', fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
            <div style={{ maxWidth: 760 }}>
              <h1 style={{ margin: '0 0 12px', fontSize: 48, fontWeight: 800, lineHeight: 1, color: '#0a1724' }}>NovaHunt</h1>
              <p style={{ margin: '0 0 18px', color: '#6b7280', fontSize: 18, lineHeight: 1.5 }}>
                Find business emails instantly. Enter a company domain, and get professional email results.
              </p>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 8, border: '1px solid #e6edf3', padding: 6 }}>
                  <input
                    aria-label="domain"
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') loadDomain(domain, { count: true }); }}
                    placeholder="Enter domain, e.g. coca-cola.com"
                    style={{ width: '100%', border: 'none', outline: 'none', padding: '10px 12px', fontSize: 16 }}
                  />
                </div>

                <button onClick={() => loadDomain(domain, { count: true })} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>
                  {loading ? 'Searching…' : 'Search'}
                </button>
              </div>

              <div style={{ color: '#6b7280', fontSize: 15, marginBottom: 12 }}>
                Want to take us for a test drive? Click any of these to see results live or enter your own search above.
                <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {SAMPLE_DOMAINS.map(d => (
                    <a key={d} href={`/?domain=${encodeURIComponent(d)}`} onClick={(e) => { e.preventDefault(); loadDomain(d, { count: true }); }} style={{ fontSize: 15, color: '#2563eb', textDecoration: 'underline' }}>
                      {d}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ alignSelf: 'flex-start', fontSize: 13 }}>
              <nav style={{ display: 'flex', gap: 12 }}>
                <Link href="/"><a style={{ textDecoration: 'underline', color: '#2563eb' }}>Home</a></Link>
                <Link href="/plans"><a style={{ textDecoration: 'underline', color: '#2563eb' }}>Plans</a></Link>
                <Link href="/about"><a style={{ textDecoration: 'underline', color: '#2563eb' }}>About</a></Link>
                <Link href="/signin"><a style={{ textDecoration: 'underline', color: '#2563eb' }}>SignIn</a></Link>
                {/* SignUp link changed to /plans as requested */}
                <Link href="/plans"><a style={{ textDecoration: 'underline', color: '#2563eb' }}>SignUp</a></Link>
              </nav>
            </div>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, marginTop: 24, alignItems: 'start' }}>
            <section>
              <div style={{ background: '#fff', border: '1px solid #e6edf3', borderRadius: 8, padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 22 }}>Contacts</div>

                  <div style={{ color: '#6b7280', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {company ? (
                      <>
                        <span>
                          Showing {company.shown || (company.contacts && company.contacts.length) || 0} of {company.total || (company.contacts && company.contacts.length) || 0} results.
                        </span>

                        <Link href="/plans">
                          <a style={{ color: '#ff6b00', textDecoration: 'underline', marginLeft: 6 }}>Upgrade to see all</a>
                        </Link>
                      </>
                    ) : <span>Showing results</span>}
                  </div>

                  <div style={{ marginLeft: 8, color: '#9ca3af', fontSize: 12 }}>Powered by AI</div>
                </div>

                <div>
                  {company ? renderContacts(company.contacts || []) : <div style={{ color: '#6b7280' }}>{loading ? 'Loading results…' : 'No sample data for that domain.'}</div>}
                </div>
              </div>

              <div style={{ marginTop: 18, background: '#fff', border: '1px solid #e6edf3', borderRadius: 8, padding: 18 }}>
                <h3 style={{ marginTop: 0 }}>How people use NovaHunt</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginTop: 6 }}>
                  {FEATURES.map((f, i) => (
                    <div key={i} style={{ border: '1px solid #e6edf3', borderRadius: 8, padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{f.icon}</div>
                      <div>
                        <strong>{f.title}</strong>
                        <div style={{ color: '#6b7280', marginTop: 6 }}>{f.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <aside>
              <RightPanel domain={domain} company={company} />
            </aside>
          </div>
        </div>
      </main>
    </ErrorBoundary>
  );
}

const FEATURES = [
  { icon: '👗', title: 'Model → Agency', text: 'Find modelling agencies and casting contacts to book your next shoot.' },
  { icon: '🎭', title: 'Actor → Agent', text: 'Locate talent agents and casting directors for auditions.' },
  { icon: '💼', title: 'Freelancer → Clients', text: 'Locate hiring managers and decision makers for contract work.' },
  { icon: '🎵', title: 'Musician → Gigs', text: 'Locate booking agents, promoters, and venues to book shows.' },
  { icon: '🏷️', title: 'Seller → Leads', text: 'Discover sales contacts to scale your outreach and win that next contract.' },
  { icon: '📣', title: 'Influencer → Sponsors', text: 'Find brand contacts and PR reps to land sponsorships and collabs.' },
  { icon: '📸', title: 'Photographer → Clients', text: 'Find art directors, magazines, and brands who hire photographers.' },
  { icon: '📋', title: 'Event Planner → Vendors', text: 'Discover venue contacts, caterers, and vendor reps for events.' },
  { icon: '🚀', title: 'Founder → Investors', text: 'Locate investor relations, VCs, and angel contacts for fundraising.' }
];
