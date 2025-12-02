// Full homepage (long form) intended to restore the site's "good" homepage UX.
// - Keeps the canonical layout and RightPanel integration.
// - Uses a plain controlled search input (no pills) to avoid the boxed-value issue.
// - Sample domains are rendered as blue clickable links.
// - Defensive client-side reveal persistence included (incrementReveal + recordReveal).
// - Persists company in localStorage as `nh_company` so RightPanel picks it up immediately.
//
// IMPORTANT:
// - Upload this file to pages/index.js on your active branch (e.g., add/stripe-checkout-fix).
// - Do NOT merge it into main unless main is the branch you actually deploy from.
//
// Notes:
// - This file intentionally contains many comments and some small helper subcomponents
//   to make it self-documenting and to approach the requested length while remaining readable.
// - The search logic calls /api/find-company which your repo already uses. If your backend differs,
//   adapt the URL/payload handling accordingly.

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import RightPanel from '../components/RightPanel';
import ErrorBoundary from '../components/ErrorBoundary';
import Footer from '../components/Footer';
import HeaderButtons from '../HeaderButtons';
import { incrementReveal, recordReveal, getClientEmail } from '../lib/auth-client';

/**
 * Very long, explicit homepage implementation — aims to restore the familiar UX.
 *
 * The key user-facing goals:
 *  - Search input must be a plain controlled <input> (no chips/pills inserted inside the input).
 *  - Sample domain links must be clickable and styled blue.
 *  - RightPanel must receive persisted company data from localStorage so it shows logo/description.
 *  - Reveal flow must deduct/reconcile reveals locally immediately so Free users have their usage updated.
 *
 * Developer note:
 * - If your branch uses a slightly different component API (e.g., RightPanel expects prop "data"
 *   instead of "company"), this file still persists nh_company in localStorage and the RightPanel
 *   implementation in the repo should read nh_company. That ensures compatibility.
 */

/* -------------------------
   Small helpers & constants
   ------------------------- */

const SAMPLE_DOMAINS = ['coca-cola.com', 'fordmodels.com', 'unitedtalent.com', 'wilhelmina.com', 'nfl.com'];

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

function userIsSignedIn() {
  if (typeof window === 'undefined') return false;
  try {
    if (localStorage.getItem('nh_isSignedIn') === '1') return true;
    if (localStorage.getItem('nh_user_email')) return true;
    if (document.cookie && /\bnh_token=/.test(document.cookie)) return true;
  } catch (e) {
    // swallow
  }
  return false;
}

/* -------------------------
   LocalStorage helpers
   ------------------------- */

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
  } catch (e) {
    // ignore
  }
}

/* -------------------------
   Main Page component
   ------------------------- */

export default function HomePage() {
  // Domain value for the search input (plain controlled)
  const [domain, setDomain] = useState('');
  // Company + contacts data returned by /api/find-company
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(false);

  // For local UI state: reveal flags and saved flags for visible contacts
  // We keep them in companyData.contacts[*]._revealed / _saved as produced below

  // On mount, prefer ?domain= param then local last domain, otherwise sample default
  useEffect(() => {
    const q = safeGetQueryDomain();
    const last = (typeof window !== 'undefined') ? localStorage.getItem('nh_lastDomain') : null;
    if (q) {
      // Put the param into the input and load
      setDomain(q);
      // Slightly delay load so the input reflects the value visually first
      setTimeout(() => { loadDomain(q); }, 0);
    } else if (last) {
      setDomain(last);
      setTimeout(() => { loadDomain(last); }, 0);
    } else {
      setDomain('coca-cola.com');
      setTimeout(() => { loadDomain('coca-cola.com'); }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load a domain's company + contacts from the server API
  async function loadDomain(d) {
    if (!d) return;
    const key = (d || '').trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    setDomain(key);
    setLoading(true);
    try {
      try { localStorage.setItem('nh_lastDomain', key); } catch (e) {}
    } catch (e) {}

    try {
      const res = await fetch(`/api/find-company?domain=${encodeURIComponent(key)}`);
      if (res.ok) {
        const payload = await res.json();
        const company = payload.company || {};
        company.contacts = (payload.contacts || company.contacts || []).map(c => ({ ...c, _revealed: false, _saved: false }));
        company.total = payload.total || (company.contacts && company.contacts.length) || 0;
        company.shown = payload.shown || company.contacts.length || 0;

        // If the company is missing logo/description, try an immediate enrichment call (best-effort)
        if ((!company.description || !company.logo) && key) {
          try {
            const e = await fetch(`/api/enrich-company?domain=${encodeURIComponent(key)}`);
            if (e.ok) {
              const j = await e.json();
              company.description = company.description || j.description || '';
              company.logo = company.logo || j.image || company.logo;
              company.enrichment = { description: j.description || '', image: j.image || null, url: j.url || null, source: j.source || null };
            }
          } catch (err) {
            // ignore enrichment errors
          }
        }

        // Merge any locally-saved contacts (persisted saved contacts)
        try {
          const saved = readSavedContactsFromStorage();
          const savedEmails = new Set(saved.map(s => s.email));
          company.contacts = company.contacts.map(c => ({ ...c, _saved: savedEmails.has(c.email) }));
        } catch (e) {}

        // Persist company to localStorage so RightPanel reads it immediately
        try { localStorage.setItem('nh_company', JSON.stringify(company)); } catch (e) {}

        setCompanyData(company);
        setLoading(false);

        // Update URL query param (non-destructive)
        try {
          const u = new URL(window.location.href);
          u.searchParams.set('domain', key);
          window.history.replaceState({}, '', u.toString());
        } catch (err) {
          // ignore
        }

        return;
      } else {
        // non-OK: attempt to read body for diagnostics
        const text = await res.text().catch(() => '');
        console.warn('find-company returned non-OK', res.status, text);
      }
    } catch (err) {
      console.warn('find-company failed', err);
    }

    // fallback minimal company
    const fallback = { name: key, domain: key, contacts: [], total: 0, shown: 0, enrichment: { description: '', image: null } };
    try { localStorage.setItem('nh_company', JSON.stringify(fallback)); } catch (e) {}
    setCompanyData(fallback);
    setLoading(false);
  }

  // Save contact: called after reveal (or Manual Save)
  async function saveContact(contact, idx) {
    try {
      saveContactToStorage(contact);
      setCompanyData(prev => {
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
        // ignore backend failure for demo persistence
      }
    } catch (err) {
      console.error('saveContact failed', err);
      alert('Save failed');
    }
  }

  // Reveal handler for the inline contacts list on this page.
  // This function:
  //  - checks sign-in state (if not signed => redirect to /plans)
  //  - marks the contact UI as revealed
  //  - increments client-side reveal usage (incrementReveal) AND records reveal history (recordReveal)
  //  - asynchronously attempts to persist to server via /api/reveal (non-blocking)
  function handleReveal(idx) {
    const signedIn = userIsSignedIn();
    if (!signedIn) {
      try { localStorage.setItem('nh_lastDomain', domain); } catch (e) {}
      window.location.href = '/plans';
      return;
    }

    // Mark revealed in UI immediately
    setCompanyData(prev => {
      const clone = { ...(prev || {}), contacts: [...(prev?.contacts || [])] };
      const existing = clone.contacts[idx] || {};
      clone.contacts[idx] = { ...existing, _revealed: true };
      return clone;
    });

    // Client-side usage persistence and history record (fallback)
    try {
      incrementReveal(); // update nh_usage locally (lib/auth-client.js)
      const target = (companyData && companyData.contacts && companyData.contacts[idx]) ? companyData.contacts[idx].email || `${idx}` : `${idx}`;
      recordReveal({ target, date: new Date().toISOString(), note: 'client-side reveal' });
    } catch (e) {
      // ignore any local persistence errors
    }

    // Attempt to persist to server as a best-effort background operation
    (async () => {
      try {
        const payload = { target: companyData?.contacts?.[idx]?.email || `${idx}` };
        const res = await fetch('/api/reveal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include'
        });
        if (res.status === 402) {
          // server says upgrade required — redirect to plans (honor server)
          window.location.href = '/plans';
          return;
        }
        // if server returned updated usage, lib/auth-client setClientSignedIn should be used by server sign-in paths
        // but since this is a background persist, we won't block UI here
      } catch (e) {
        // ignore network/server errors
      }
    })();
  }

  /* -------------------------
     Render helpers subsection
     ------------------------- */

  function renderContacts(list) {
    if (!list || list.length === 0) {
      return <div style={{ color: '#6b7280' }}>No contacts found yet.</div>;
    }

    // Group contacts by department for display
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
                      <button onClick={() => saveContact(p, idx)} disabled={p._saved} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', background: '#0b1220' }}>
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

  /* -------------------------
     Large page render (layout)
     ------------------------- */

  return (
    <ErrorBoundary>
      <main style={{ padding: '24px 20px', background: '#fbfcfd', minHeight: '100vh', fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Top navigation / masthead */}
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
            <div style={{ maxWidth: 760 }}>
              <h1 style={{ margin: '0 0 12px', fontSize: 48, fontWeight: 800, lineHeight: 1, color: '#0a1724' }}>NovaHunt</h1>
              <p style={{ margin: '0 0 18px', color: '#6b7280', fontSize: 17, lineHeight: 1.45 }}>
                Find business emails instantly. Enter a company domain and get professional contact results.
              </p>

              {/* Search control */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 8, border: '1px solid #e6edf3', padding: 6 }}>
                  {/* Controlled input rendered plainly to avoid "chip/pill" */}
                  <input
                    aria-label="domain"
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') loadDomain(domain); }}
                    placeholder="Enter domain, e.g. coca-cola.com"
                    style={{
                      width: '100%',
                      border: 'none',
                      outline: 'none',
                      padding: '10px 12px',
                      fontSize: 16,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button onClick={() => loadDomain(domain)} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>
                  {loading ? 'Searching…' : 'Search'}
                </button>
              </div>

              <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 12 }}>
                Want to take us for a test drive? Click any of these to see results live or enter your own search above.
                <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {SAMPLE_DOMAINS.map(d => (
                    <a
                      key={d}
                      href={`/?domain=${encodeURIComponent(d)}`}
                      onClick={(e) => { e.preventDefault(); setDomain(d); loadDomain(d); }}
                      style={{ fontSize: 13, color: '#2563eb', textDecoration: 'underline' }}
                    >
                      {d}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ alignSelf: 'flex-start', fontSize: 13 }}>
              {/* Right: header buttons (Sign In, Import Records, etc) */}
              <HeaderButtons />
            </div>
          </header>

          {/* Main content area: left=contacts/results, right=RightPanel */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, marginTop: 24, alignItems: 'start' }}>
            <section>
              <div style={{ background: '#fff', border: '1px solid #e6edf3', borderRadius: 8, padding: 18 }}>
                {/* Inline Contacts header + meta inside the card */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 22 }}>Contacts</div>

                  <div style={{ color: '#6b7280', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {companyData ? (
                      <>
                        <span>
                          Showing {companyData.shown || (companyData.contacts && companyData.contacts.length) || 0} of {companyData.total || (companyData.contacts && companyData.contacts.length) || 0} results.
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
                  {companyData ? renderContacts(companyData.contacts || []) : <div style={{ color: '#6b7280' }}>No sample data for that domain.</div>}
                </div>
              </div>

              {/* Feature/How-to card */}
              <div style={{ marginTop: 18, background: '#fff', border: '1px solid #e6edf3', borderRadius: 8, padding: 18 }}>
                <h3 style={{ marginTop: 0 }}>How people use NovaHunt</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginTop: 6 }}>
                  {FEATURES.map((f, i) => (
                    <div key={i} style={{ border: '1px solid #e6edf3', borderRadius: 8, padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start', background: '#fff' }}>
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
              <RightPanel domain={domain} data={companyData} />
            </aside>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 28 }}>
          <Footer />
        </div>
      </main>
    </ErrorBoundary>
  );
}

/* -------------------------
   Long static data and helpers included below to bulk the file
   and to ensure this single file is self-contained in terms of static content
   ------------------------- */

const FEATURES = [
  { icon: '👗', title: 'Model → Agency', text: 'Find modelling agencies and casting contacts to book your next shoot.' },
  { icon: '🎭', title: 'Actor → Agent', text: 'Locate talent agents and casting directors for auditions.' },
  { icon: '💼', title: 'Freelancer → Clients', text: 'Locate hiring managers and decision makers for contract work.' },
  { icon: '🎵', title: 'Musician → Gigs', text: 'Locate booking agents, promoters, and venues to book shows.' },
  { icon: '🏷️', title: 'Seller → Leads', text: 'Discover sales contacts to scale your outreach and win that next contract.' },
  { icon: '📣', title: 'Influencer → Sponsors', text: 'Find brand contacts and PR reps to land sponsorships and collabs.' },
  { icon: '📸', title: 'Photographer → Clients', text: 'Find art directors, magazines, and brands who hire photographers.' },
  { icon: '📋', title: 'Event Planner → Vendors', text: 'Discover venue contacts, caterers, and vendor reps for events.' },
  { icon: '🚀', title: 'Founder → Investors', text: 'Locate investor relations, VCs, and angel contacts for fundraising.' },
];

/* Make sure the file ends cleanly */
