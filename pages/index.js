// pages/index.js
import { useEffect, useState } from 'react';
import axios from 'axios';
import Head from 'next/head';
import CompanyProfilePanel from '../components/CompanyProfilePanel';

const PRELOAD_DOMAINS = [
  'coca-cola.com',
  'fordmodels.com',
  'unitedtalent.com',
  'wilhelmina.com',
  'nfl.com',
];

function maskEmail(email) {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  if (local.length <= 2) return '★'.repeat(local.length) + '@' + domain;
  const visible = Math.max(1, Math.floor(local.length * 0.25));
  return local.slice(0, visible) + '•••' + '@' + domain;
}

export default function Home() {
  const [input, setInput] = useState('');
  const [domain, setDomain] = useState('');
  const [emails, setEmails] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [revealed, setRevealed] = useState(Object.create(null));
  const [companyProfile, setCompanyProfile] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    if (!domain) return;

    async function fetchAll() {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`/api/find-emails?domain=${encodeURIComponent(domain)}`);
        if (res.data && res.data.ok) {
          setEmails(res.data.emails || []);
          setTotal(res.data.total || (res.data.emails || []).length);
        } else {
          setEmails([]);
          setTotal(0);
          setError(res.data?.error || 'No results');
        }
      } catch (err) {
        setError(err?.response?.data?.error || 'Search error');
        setEmails([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
    fetchCompanyProfile(domain);
    setRevealed(Object.create(null));
  }, [domain]);

  async function fetchCompanyProfile(d) {
    const cleanName = d.split('.').shift()?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || d;
    const clearbit = `https://logo.clearbit.com/${d}`;
    setLogoUrl(clearbit);

    try {
      const wiki = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName)}`, { timeout: 6000 });
      const extract = wiki?.data?.extract || `${cleanName} is an innovative company shaping the future.`;
      const summary = extract.length > 700 ? extract.slice(0, 700) + '…' : extract;
      setCompanyProfile({
        name: cleanName,
        logo: clearbit,
        tagline: '',
        industry: '',
        employeeCount: null,
        hq: '',
        summary,
        website: `https://${d}`,
        founded: null,
      });
    } catch (e) {
      setCompanyProfile({
        name: cleanName,
        logo: clearbit,
        tagline: '',
        industry: '',
        employeeCount: null,
        hq: '',
        summary: `${cleanName} has been pushing boundaries since day one. From humble beginnings to becoming a trusted name, they continue to inspire with bold ideas and relentless drive.`,
        website: `https://${d}`,
        founded: null,
      });
    }
  }

  function startSearch(q) {
    const normalized = q.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    if (!normalized) return;
    setInput(normalized);
    setDomain(normalized);
  }

  function toggleReveal(email) {
    setRevealed(prev => ({ ...prev, [email]: !prev[email] }));
  }

  return (
    <>
      <Head>
        <title>NovaHunt — Find business contacts by domain</title>
      </Head>

      <div style={{ minHeight: '100vh', padding: 24, background: '#f8fafc' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 84, height: 84, borderRadius: 12, background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 32, fontWeight: 700 }}>
                N
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>NovaHunt</div>
                <div style={{ color: '#6b7280' }}>Find business contacts by domain — fast and friendly.</div>
              </div>
            </div>

            <div style={{ flex: '0 0 48%', display: 'flex', justifyContent: 'flex-end' }}>
              <input
                placeholder="Enter a company domain (e.g., coca-cola.com)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={{ padding: '10px 12px', width: '65%', borderRadius: 8, border: '1px solid #d1d5db', marginRight: 8 }}
                onKeyDown={(e) => { if (e.key === 'Enter') startSearch(input); }}
              />
              <button onClick={() => startSearch(input)} style={{ padding: '10px 14px', borderRadius: 8, background: '#2563eb', color: 'white', border: 'none' }}>
                Search
              </button>
            </div>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 18 }}>
            <main>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20 }}>{domain ? `Results for ${domain}` : 'Search a domain above'}</h2>
                  <div style={{ color: '#6b7280', fontSize: 13 }}>
                    {domain && `Displaying ${emails.length} of ${total} results`}
                  </div>
                </div>
              </div>

              <section style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 0 0 1px rgba(15,23,42,0.02)' }}>
                {loading && <div style={{ color: '#6b7280' }}>Loading emails…</div>}
                {error && <div style={{ color: '#b91c1c' }}>{error}</div>}

                {!loading && !error && emails.length === 0 && domain && (
                  <div style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>No public emails found (common for private companies)</div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {emails.map((e, i) => {
                    const email = e.email || '';
                    const shown = revealed[email];
                    const name = [e.first_name, e.last_name].filter(Boolean).join(' ') || '';
                    const linkedInQuery = encodeURIComponent(`${name} ${domain} site:linkedin.com`);
                    const sourceUrl = `https://www.google.com/search?q=${linkedInQuery}`;

                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8, border: '1px solid #eef2f7' }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <div style={{ width: 44, height: 44, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                            {name ? name.split(' ').map(n => n[0]).join('').slice(0,2) : '🔎'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700 }}>{name || (email.split('@')[0])}</div>
                            <div style={{ color: '#6b7280', fontSize: 13 }}>
                              {shown ? email : maskEmail(email)} {e.position ? ` • ${e.position}` : ''}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                            <button style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e6edf3', background: '#f3f4f6' }}>
                              Source
                            </button>
                          </a>

                          <button onClick={() => toggleReveal(email)} style={{ padding: '8px 10px', borderRadius: 8, background: shown ? '#ef4444' : '#10b981', color: 'white', border: 'none' }}>
                            {shown ? 'Hide' : 'Reveal'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </main>

            <aside style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'white', padding: 12, borderRadius: 12 }}>
                <h3 style={{ margin: '0 0 8px 0' }}>Try a sample</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {PRELOAD_DOMAINS.map((d) => (
                    <button key={d} onClick={() => startSearch(d)} style={{ textAlign: 'left', padding: 8, borderRadius: 8, border: '1px solid #e6edf3', background: '#fff' }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: 'white', padding: 12, borderRadius: 12 }}>
                {companyProfile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 84, height: 84, borderRadius: 12, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <img src={logoUrl} alt={`${companyProfile.name} logo`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e)=>{ e.target.style.display='none'; }} />
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700 }}>{companyProfile.name}</div>
                        <div style={{ color: '#6b7280', fontSize: 13 }}>{companyProfile.website}</div>
                      </div>
                    </div>

                    <CompanyProfilePanel domain={domain} companyInfo={companyProfile} />
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#6b7280' }}>Company profile will appear here after search.</div>
                )}
              </div>

              <div style={{ background: 'linear-gradient(180deg,#fff,#fbfbff)', padding: 12, borderRadius: 12, minHeight: 120 }}>
                <div style={{ color: '#6b7280' }}>Decorative footer area — features, CTAs, or promotional content.</div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
