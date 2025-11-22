import React, { useEffect, useState } from 'react';

/**
 * CompanyProfile — decorative, read-only company info panel for the search results page.
 * - Props:
 *    - domain (string) — domain being searched (e.g. coca-cola.com)
 *    - result (object) — latest search result (optional; used to display counts)
 *
 * Behavior:
 * - When domain is provided, this component calls /api/company-info?domain=<domain>
 *   and displays logo, description/history, founded, location, employees, tags, website.
 */
export default function CompanyProfile({ domain = '', result = { items: [], total: 0 } }) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!domain) {
      setInfo(null);
      setErr('');
      return;
    }

    async function load() {
      setLoading(true);
      setErr('');
      try {
        const res = await fetch(`/api/company-info?domain=${encodeURIComponent(domain)}`);
        const json = await res.json();
        if (!json || !json.ok) {
          setInfo(null);
          setErr(json && json.error ? json.error : 'No company info');
        } else {
          setInfo(json.info || null);
        }
      } catch (e) {
        setInfo(null);
        setErr(e.message || 'Failed to fetch company info');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [domain]);

  const logoStyle = { width: 88, height: 88, objectFit: 'contain', borderRadius: 6, background: '#fff' };

  return (
    <aside style={{ padding: 18, borderRadius: 10, background: '#fffaf8', border: '1px solid #ffefe6', minHeight: 360 }}>
      {!domain ? (
        <div style={{ color: '#6b7280' }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>Company profile</div>
          <div style={{ marginTop: 10 }}>Search a company to see the profile and history here.</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 88, height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: 8 }}>
              <img
                src={(info && info.logo) ? info.logo : `https://logo.clearbit.com/${domain}`}
                alt={(info && info.name) ? `${info.name} logo` : `${domain} logo`}
                style={logoStyle}
                onError={(e) => { e.target.src = '/favicon.ico'; }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#7a341f' }}>{(info && info.name) ? info.name : domain}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>
                {(info && info.tagline) ? info.tagline : (info && info.description) ? (info.description.split('.').slice(0,1).join('.') + '.') : ''}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14, display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>Overview</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ fontSize: 13 }}>
                  <div style={{ color: '#374151', fontWeight: 700 }}>{(info && info.foundedYear) ? info.foundedYear : '—'}</div>
                  <div style={{ color: '#6b7280', fontSize: 12 }}>Founded</div>
                </div>

                <div style={{ fontSize: 13 }}>
                  <div style={{ color: '#374151', fontWeight: 700 }}>{(info && info.metrics && info.metrics.employees) ? info.metrics.employees : ((info && info.size) ? info.size : '—')}</div>
                  <div style={{ color: '#6b7280', fontSize: 12 }}>Employees</div>
                </div>

                <div style={{ fontSize: 13 }}>
                  <div style={{ color: '#374151', fontWeight: 700 }}>{(info && info.location) ? info.location : ((info && info.city) ? info.city : '—')}</div>
                  <div style={{ color: '#6b7280', fontSize: 12 }}>Location</div>
                </div>

                <div style={{ fontSize: 13 }}>
                  <div style={{ color: '#374151', fontWeight: 700 }}>{result.total || 0}</div>
                  <div style={{ color: '#6b7280', fontSize: 12 }}>Contacts found</div>
                </div>
              </div>
            </div>

            <div style={{ width: 140 }}>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>Website</div>
              <div>
                <a href={`https://${domain}`} target="_blank" rel="noreferrer noopener" style={{ color: '#2563eb', fontWeight: 700 }}>
                  Visit site
                </a>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>Tags</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(info && info.tags && info.tags.length) ? info.tags.slice(0,6).map((t,i) => (
                    <div key={i} style={{ background: '#fff3ee', color: '#7a341f', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>{t}</div>
                  )) : <div style={{ color: '#9ca3af' }}>—</div>}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>History & profile</div>
            {loading ? (
              <div style={{ color: '#6b7280' }}>Loading company history…</div>
            ) : err ? (
              <div style={{ color: '#bb1b1b' }}>{err}</div>
            ) : (info && info.description) ? (
              <div style={{ color: '#374151', lineHeight: 1.45 }}>{info.description}</div>
            ) : (
              <div style={{ color: '#6b7280' }}>
                We don’t have a full company history for this profile. Try enabling CLEARBIT_API_KEY to fetch an enriched company profile, or consult the company site.
              </div>
            )}
          </div>

          <div style={{ marginTop: 14, borderTop: '1px solid #fff1ea', paddingTop: 12, color: '#6b7280', fontSize: 13 }}>
            <div>Profile sourced from public data. Use Reveal to view contact details listed on the left.</div>
          </div>
        </>
      )}
    </aside>
  );
}
