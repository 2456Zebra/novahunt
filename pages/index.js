import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import SearchClient from '../components/SearchClient';
import RightPanel from '../components/RightPanel';
import ErrorBoundary from '../components/ErrorBoundary';

// Mask email for display (keeps emails private until revealed)
function maskEmail(email) {
  if (!email) return '';
  const parts = email.split('@');
  const local = parts[0] || '';
  const domain = parts[1] || '';
  if (!local || !domain) return email;
  if (local.length <= 2) return '•'.repeat(local.length) + '@' + domain;
  const visible = Math.max(1, Math.floor(local.length * 0.25));
  return local.slice(0, visible) + '•••' + '@' + domain;
}

function toCompanyName(domain) {
  if (!domain) return 'Company';
  return domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function HomePage() {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState({});

  // Read domain param (do not auto-trigger complex behavior; SearchClient controls searching)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const u = new URL(window.location.href);
    const q = (u.searchParams.get('domain') || '').trim();
    if (q) setDomain(q);
  }, []);

  // Called by SearchClient when results return
  function handleResults({ domain: d, result: r }) {
    setDomain(d || '');
    setResult(r || { items: [], total: 0 });
  }

  function toggleReveal(email) {
    setRevealed((prev) => ({ ...prev, [email]: !prev[email] }));
  }

  // Group by department (uses 'department' field in Hunter-like payload)
  function grouped(items) {
    const groups = {};
    (items || []).forEach((it) => {
      const dept = (it.department || 'Other').trim() || 'Other';
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(it);
    });
    return groups;
  }

  // Render results grouped by department; monospace italic small font; Reveal right; Source opens linkedin-focused Google search
  function renderRows() {
    const items = (result && result.items) || [];
    if (!items.length) {
      if (!domain) return <div style={{ color: '#64748b' }}>Enter a domain to begin searching.</div>;
      return <div style={{ color: '#64748b' }}>No contacts found yet.</div>;
    }

    const groups = grouped(items);
    return Object.keys(groups).map((dept) => (
      <div key={dept} style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>{dept}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {groups[dept].map((e, i) => {
            const email = e.email || '';
            const shown = !!revealed[email];
            const name = ((e.first_name || '') + ' ' + (e.last_name || '')).trim() || (email.split('@')[0] || '');
            const linkedInQuery = encodeURIComponent((name + ' ' + (domain || '') + ' site:linkedin.com').trim());
            const sourceUrl = 'https://www.google.com/search?q=' + linkedInQuery;

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid #eef2f7',
                  background: '#fff',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace',
                  fontStyle: 'italic',
                  fontSize: 13
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      background: '#eef2ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800
                    }}
                  >
                    {(e.first_name || e.last_name) ? (((e.first_name || '').charAt(0) + (e.last_name || '').charAt(0)).toUpperCase()) : 'C'}
                  </div>

                  <div>
                    <div style={{ fontWeight: 700, fontStyle: 'normal', fontSize: 14 }}>{name}</div>
                    <div style={{ color: '#64748b', fontStyle: 'italic' }}>
                      {e.position ? (e.position + ' • ') : ''}
                      <span>{shown ? email : maskEmail(email)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={sourceUrl} target="_blank" rel="noreferrer">
                    <button style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e6edf3', background: '#fff' }}>Source</button>
                  </a>

                  <button
                    onClick={() => toggleReveal(email)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: shown ? '#ef4444' : '#10b981',
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    {shown ? 'Hide' : 'Reveal'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ));
  }

  const companyName = toCompanyName(domain);

  return (
    <main style={{ padding: 20, fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial', background: '#f8fafc', minHeight: '100vh' }}>
      <ErrorBoundary>
        {/* Header: left NovaHunt logo & unchanged search; top-right underlined nav links */}
        <header style={{ background: '#fff', padding: 20, borderRadius: 8, marginBottom: 18 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 12, background: '#0ea5e9', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800 }}>
                N
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>NovaHunt</div>
                <div style={{ color: '#475569' }}>Find business emails instantly. Enter a company domain, and get professional email results.</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {/* SearchClient is kept exactly as-is; it controls search triggering */}
              <SearchClient onResults={handleResults} />

              {/* Top-right nav (underlined links) */}
              <nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Link href="/" legacyBehavior><a style={{ textDecoration: 'underline', color: '#2563eb' }}>Home</a></Link>
                <Link href="/plans" legacyBehavior><a style={{ textDecoration: 'underline', color: '#2563eb' }}>Plans</a></Link>
                <Link href="/about" legacyBehavior><a style={{ textDecoration: 'underline', color: '#2563eb' }}>About</a></Link>
                <Link href="/signin" legacyBehavior><a style={{ textDecoration: 'underline', color: '#2563eb' }}>SignIn</a></Link>
                <Link href="/signup" legacyBehavior><a style={{ textDecoration: 'underline', color: '#2563eb' }}>SignUp</a></Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Two-column grid: left expanded results, right corporate card. Big C alignment achieved with a small spacer above the card. */}
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.8fr 360px', gap: 20 }}>
          {/* Left: results and company narrative area (we removed everything below results per instruction) */}
          <section>
            {/* Company narrative area — left side has brief facts and decorative copy (5 bullets as requested) */}
            <div style={{ background: '#fff', padding: 20, borderRadius: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>{companyName}</div>

                  <ul style={{ color: '#475569', marginTop: 12 }}>
                    <li><strong>Founded:</strong> 2010</li>
                    <li><strong>Headquarters:</strong> New York, NY</li>
                    <li><strong>Employees:</strong> ~120</li>
                    <li><strong>Industry:</strong> Technology</li>
                    <li><strong>Website:</strong> {domain || '—'}</li>
                  </ul>

                  <div style={{ marginTop: 12, color: '#475569' }}>
                    <p style={{ margin: 0 }}>
                      Meet {companyName} — a cheerful, creative team building delightful products that solve real problems. This copy is intentionally decorative and light.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Results area — expanded left width, Hunter-like vertical list grouped by department */}
            <div style={{ background: '#fff', padding: 16, borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 900 }}>{domain ? `Results for ${domain}` : 'Top contacts'}</div>
                  <div style={{ color: '#64748b', fontSize: 13 }}>{domain ? (`Displaying ${((result.items && result.items.length) || 0)} of ${result.total || 0} results`) : 'No contacts found yet.'}</div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e6edf3', background: '#fff' }}>Export</button>
                  <button onClick={() => { setDomain(''); setResult({ items: [], total: 0 }); setRevealed({}); }} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e6edf3', background: '#fff' }}>Clear</button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {loading && <div style={{ color: '#64748b' }}>Loading…</div>}
                {renderRows()}
              </div>
            </div>
          </section>

          {/* Right: corporate card (big C) + small test-ride sample domains. Big C aligned by spacer so its top equals NovaHunt logo top */}
          <aside>
            <div style={{ height: 28 }} /> {/* spacer so top of big C aligns with header NovaHunt logo top */}
            <div style={{ marginBottom: 12 }}>
              <RightPanel domain={domain} result={result} />
            </div>
          </aside>
        </div>
      </ErrorBoundary>
    </main>
  );
}
