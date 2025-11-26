import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import SearchClient from '../components/SearchClient';
import RightPanel from '../components/RightPanel';
import ErrorBoundary from '../components/ErrorBoundary';

// Mask email for display
function maskEmail(email) {
  if (!email) return '';
  var parts = email.split('@');
  var local = parts[0] || '';
  var domain = parts[1] || '';
  if (!local || !domain) return email;
  if (local.length <= 2) return '•'.repeat(local.length) + '@' + domain;
  var visible = Math.max(1, Math.floor(local.length * 0.25));
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
  const [error, setError] = useState('');
  const [revealed, setRevealed] = useState({});

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const u = new URL(window.location.href);
    const q = (u.searchParams.get('domain') || '').trim();
    if (q) setDomain(q);
  }, []);

  function handleResults({ domain: d, result: r }) {
    setDomain(d || '');
    setResult(r || { items: [], total: 0 });
    setError('');
  }

  function toggleReveal(email) {
    setRevealed((prev) => {
      const copy = { ...prev };
      copy[email] = !copy[email];
      return copy;
    });
  }

  // Group items by department
  function groupedItems(items) {
    const groups = {};
    (items || []).forEach((it) => {
      const dept = (it.department || 'Other').trim() || 'Other';
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(it);
    });
    return groups;
  }

  // Render rows grouped by department
  function renderRows() {
    const items = result && result.items ? result.items : [];
    if (!items || items.length === 0) {
      if (!domain) return <div style={{ color: '#64748b' }}>Enter a domain to begin searching.</div>;
      return <div style={{ color: '#64748b' }}>No contacts found yet.</div>;
    }

    const groups = groupedItems(items);
    const groupKeys = Object.keys(groups);

    return groupKeys.map((g) => (
      <div key={g} style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>{g}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {groups[g].map((e, i) => {
            const email = e.email || '';
            const shown = !!revealed[email];
            const name = ((e.first_name || '') + ' ' + (e.last_name || '')).trim() || email.split('@')[0];
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
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace',
                  fontStyle: 'italic',
                  fontSize: 13,
                  background: '#fff'
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {(e.first_name || e.last_name) ? (((e.first_name || '').charAt(0) + (e.last_name || '').charAt(0)).toUpperCase()) : 'C'}
                  </div>

                  <div>
                    <div style={{ fontWeight: 700, fontStyle: 'normal', fontFamily: 'inherit', fontSize: 14 }}>{name}</div>
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
              {/* Keep SearchClient as-is */}
              <SearchClient onResults={handleResults} />

              {/* Top-right nav (underlined, clickable text) */}
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

        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.6fr 360px', gap: 20 }}>
          {/* Left: main content */}
          <section>
            {/* Company block (Title only + bullets + narrative). small logo removed */}
            <div style={{ background: '#fff', padding: 20, borderRadius: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>{companyName}</div>

                  {/* Bullets (brief facts) */}
                  <ul style={{ color: '#475569', marginTop: 12 }}>
                    <li><strong>Founded:</strong> 2010</li>
                    <li><strong>Location:</strong> New York, NY</li>
                    <li><strong>Employees:</strong> 120</li>
                  </ul>

                  {/* Decorative narrative */}
                  <div style={{ marginTop: 12, color: '#475569' }}>
                    <p style={{ margin: 0 }}>
                      Meet {companyName} — a cheerful, creatively-minded team building delightful products that solve real problems.
                      We love good design, coffee, and a sensible spreadsheet.
                    </p>
                    <p style={{ marginTop: 8 }}>
                      This section is decorative and meant to give a warm, human summary of the company. Add images or logos later for a richer feel.
                    </p>
                  </div>
                </div>

                {/* Move the big C down visually in the right column area by adding top spacing in the sidebar (handled in RightPanel). */}
              </div>
            </div>

            {/* Results area (expanded left width, pure vertical Hunter-like results, grouped) */}
            <div style={{ background: '#fff', padding: 16, borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 900 }}>{domain ? `Results for ${domain}` : 'Top contacts'}</div>
                  <div style={{ color: '#64748b', fontSize: 13 }}>
                    {domain ? ('Displaying ' + ((result.items && result.items.length) || 0) + ' of ' + (result.total || 0) + ' results') : 'No contacts found yet.'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e6edf3', background: '#fff' }}>Export</button>
                  <button onClick={() => { setDomain(''); setResult({ items: [], total: 0 }); setRevealed({}); }} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e6edf3', background: '#fff' }}>Clear</button>
                </div>
              </div>

              {/* Results grouped */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {loading && <div style={{ color: '#64748b' }}>Loading…</div>}
                {error && <div style={{ color: '#ef4444' }}>{error}</div>}
                {renderRows()}
              </div>
            </div>
          </section>

          {/* Right: side panel (company card + sample domains + CTA). Big C is positioned lower via marginTop */}
          <aside>
            <div style={{ height: 24 }} /> {/* small spacer so big C visually aligns with NovaHunt logo */}
            <div style={{ background: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 }}>
              <RightPanel domain={domain} result={result} />
            </div>

            <div style={{ background: '#fff', padding: 16, borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700 }}>View Results</div>
                <div style={{ color: '#64748b' }}>Export</div>
              </div>
              <div style={{ marginTop: 12 }}>
                <a href="/plans" style={{ color: '#2563eb' }}>See Plans</a>
              </div>
            </div>
          </aside>
        </div>
      </ErrorBoundary>
    </main>
  );
}
