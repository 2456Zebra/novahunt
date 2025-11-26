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

export default function HomePage() {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [revealed, setRevealed] = useState({});

  // If a domain query param is present, trigger search once on client mount.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const u = new URL(window.location.href);
    const q = u.searchParams.get('domain') || '';
    if (q) {
      setDomain(q);
      // Optionally could trigger a search automatically by invoking SearchClient's logic,
      // but SearchClient picks up user input; this preserves current behavior.
    }
  }, []);

  // Expose a handler that SearchClient will call with results
  function handleResults({ domain: d, result: r }) {
    setDomain(d || '');
    setResult(r || { items: [], total: 0 });
    setError('');
  }

  // Toggle reveal of a specific email
  function toggleReveal(email) {
    setRevealed((prev) => {
      var copy = Object.assign({}, prev);
      copy[email] = !copy[email];
      return copy;
    });
  }

  // Render contact rows
  function renderRows() {
    var items = result && result.items ? result.items : [];
    if (!items || items.length === 0) {
      if (!domain) {
        return <div style={{ color: '#64748b' }}>Enter a domain to begin searching.</div>;
      }
      return <div style={{ color: '#64748b' }}>No contacts found yet.</div>;
    }

    return items.map(function (e, i) {
      var email = e.email || '';
      var shown = !!revealed[email];
      var name = ((e.first_name || '') + ' ' + (e.last_name || '')).trim();
      if (!name) name = email.split('@')[0];
      var linkedInQuery = encodeURIComponent((name + ' ' + (domain || '') + ' site:linkedin.com').trim());
      var sourceUrl = 'https://www.google.com/search?q=' + linkedInQuery;

      return (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #eef2f7', padding: 12, borderRadius: 8 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              { (e.first_name || e.last_name) ? (( (e.first_name || '').charAt(0) + (e.last_name || '').charAt(0) ).toUpperCase()) : 'C' }
            </div>

            <div>
              <div style={{ fontWeight: 700 }}>{name}</div>
              <div style={{ color: '#64748b' }}>
                {e.position ? (e.position + ' • ') : ''}
                <span>{ shown ? email : maskEmail(email) }</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <a href={sourceUrl} target="_blank" rel="noreferrer">
              <button style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e6edf3', background: '#fff' }}>
                Source
              </button>
            </a>

            <button
              onClick={() => toggleReveal(email)}
              style={{ padding: '8px 10px', borderRadius: 8, background: shown ? '#ef4444' : '#10b981', color: 'white', border: 'none' }}
            >
              {shown ? 'Hide' : 'Reveal'}
            </button>
          </div>
        </div>
      );
    });
  }

  return (
    <main style={{ padding: 20, fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial', background: '#f8fafc', minHeight: '100vh' }}>
      <ErrorBoundary>
        <header style={{ background: '#fff', padding: 20, borderRadius: 8, marginBottom: 18 }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 12, background: '#0ea5e9', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800 }}>
                N
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>NovaHunt</div>
                <div style={{ color: '#475569' }}>Find business emails instantly. Enter a company domain, and get professional email results.</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <SearchClient onResults={handleResults} />
            </div>
          </div>
        </header>

        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
          {/* Left: main content */}
          <section>
            {/* Company block (big C) */}
            <div style={{ background: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 72, height: 72, borderRadius: 12, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800 }}>
                  C
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>Company</div>
                  <div style={{ color: '#475569', marginTop: 6 }}>Meet Company: a scrappy team solving problems in surprisingly delightful ways.</div>

                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <button style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e6edf3', background: '#fff' }}>Show more</button>
                    <button style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e6edf3', background: '#fff' }}>Regenerate</button>
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>Top contacts</div>
                      <div style={{ color: '#64748b' }}>{(result.items && result.items.length) ? `${result.items.length} contacts` : 'No contacts found yet.'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Results area */}
            <div style={{ background: '#fff', padding: 16, borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{domain ? `Results for ${domain}` : 'Top contacts'}</div>
                  <div style={{ color: '#64748b', fontSize: 13 }}>
                    {domain ? ('Displaying ' + ((result.items && result.items.length) || 0) + ' of ' + (result.total || 0) + ' results') : 'No contacts found yet.'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e6edf3', background: '#fff' }}>Export</button>
                  <button onClick={() => { setDomain(''); setResult({ items: [], total: 0 }); setRevealed({}); }} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e6edf3', background: '#fff' }}>Clear</button>
                </div>
              </div>

              {/* Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {loading && <div style={{ color: '#64748b' }}>Loading…</div>}
                {error && <div style={{ color: '#ef4444' }}>{error}</div>}
                {renderRows()}
              </div>
            </div>

            {/* How it works */}
            <div style={{ marginTop: 18, background: '#fff', padding: 18, borderRadius: 12 }}>
              <h3 style={{ marginTop: 0 }}>How it works</h3>
              <p style={{ color: '#475569' }}>Enter a company domain, see all publicly available emails, and reveal verified email addresses.</p>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <div style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #eef2f7' }}>
                  <div style={{ fontWeight: 700 }}>Step 1</div>
                  <div style={{ color: '#64748b' }}>Search a company domain.</div>
                </div>

                <div style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #eef2f7' }}>
                  <div style={{ fontWeight: 700 }}>Step 2</div>
                  <div style={{ color: '#64748b' }}>Browse results and find emails.</div>
                </div>

                <div style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #eef2f7' }}>
                  <div style={{ fontWeight: 700 }}>Step 3</div>
                  <div style={{ color: '#64748b' }}>Export or reveal professional emails.</div>
                </div>
              </div>
            </div>

            {/* Features + CTA */}
            <div style={{ marginTop: 18, display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, background: '#fff', padding: 18, borderRadius: 12 }}>
                <h4 style={{ marginTop: 0 }}>Features</h4>
                <ul style={{ color: '#475569', margin: 0, paddingLeft: 18 }}>
                  <li>Instant company email search</li>
                  <li>Verified professional emails</li>
                  <li>Role-based filtering</li>
                  <li>Location-based search</li>
                  <li>Easy export for CRM integration</li>
                </ul>
              </div>

              <div style={{ width: 320, background: '#f8fafc', padding: 18, borderRadius: 12 }}>
                <h4 style={{ marginTop: 0 }}>Get Started</h4>
                <p style={{ color: '#475569' }}>Create an account and start finding emails today.</p>
                <Link href="/signup" legacyBehavior>
                  <a>
                    <button style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#2563eb', color: 'white', border: 'none' }}>
                      Sign Up
                    </button>
                  </a>
                </Link>
              </div>
            </div>
          </section>

          {/* Right: side panel (company card + sample domains + CTA) */}
          <aside>
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
