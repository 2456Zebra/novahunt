// pages/index.js
import { useEffect, useState } from 'react';
import axios from 'axios';

function MaskedEmail({ email }) {
  if (!email) return '';
  var parts = email.split('@');
  var local = parts[0] || '';
  var domain = parts[1] || '';
  if (!local || !domain) return email;
  if (local.length <= 2) return '•'.repeat(local.length) + '@' + domain;
  var visible = Math.max(1, Math.floor(local.length * 0.25));
  return local.slice(0, visible) + '•••' + '@' + domain;
}

export default function Home() {
  const [input, setInput] = useState('');
  const [domain, setDomain] = useState('');
  const [emails, setEmails] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!domain) return;
    setLoading(true);
    setError('');
    setEmails([]);
    setTotal(0);

    var url = '/api/find-emails?domain=' + encodeURIComponent(domain);
    axios.get(url)
      .then(function (res) {
        if (res && res.data && res.data.ok) {
          var list = res.data.emails || [];
          setEmails(list);
          setTotal(res.data.total || (list.length || 0));
        } else {
          setError((res && res.data && res.data.error) ? res.data.error : 'No results');
        }
      })
      .catch(function (err) {
        setError((err && err.response && err.response.data && err.response.data.error) ? err.response.data.error : (err && err.message) ? err.message : 'Search error');
      })
      .finally(function () {
        setLoading(false);
      });
  }, [domain]);

  function doSearch() {
    var normalized = input.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    if (!normalized) return;
    setDomain(normalized);
  }

  function clearSearch() {
    setInput('');
    setDomain('');
    setEmails([]);
    setTotal(0);
    setError('');
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial', color: '#0f172a' }}>
      <header style={{ background: '#ffffff', padding: 28, borderBottom: '1px solid #e6edf3' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 12, background: '#0ea5e9', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 30 }}>
              N
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>NovaHunt</div>
              <div style={{ color: '#475569' }}>Find business emails instantly. Enter a company domain, and get professional email results.</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={input}
              onChange={function (e) { setInput(e.target.value); }}
              placeholder="Enter domain, e.g. coca-cola.com"
              onKeyDown={function (e) { if (e.key === 'Enter') doSearch(); }}
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e6edf3', width: 320 }}
            />
            <button onClick={doSearch} style={{ padding: '10px 14px', borderRadius: 8, background: '#2563eb', color: 'white', border: 'none' }}>Search</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '28px auto', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        <section>
          <div style={{ background: 'white', borderRadius: 12, padding: 20, marginBottom: 18 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 72, height: 72, borderRadius: 12, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800 }}>
                C
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>Company</div>
                    <div style={{ color: '#475569', marginTop: 6 }}>Meet Company: a scrappy team solving problems in surprisingly delightful ways.</div>
                    <div style={{ marginTop: 8 }}>
                      <button style={{ marginRight: 8, padding: '6px 10px', borderRadius: 8, border: '1px solid #e6edf3', background: '#fff' }}>Show more</button>
                      <button style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e6edf3', background: '#fff' }}>Regenerate</button>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Top contacts</div>
                    <div style={{ color: '#64748b' }}>No contacts found yet.</div>
                  </div>
                </div>

                <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                  <button style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e6edf3', background: '#fff' }}>View Results</button>
                  <button style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e6edf3', background: '#fff' }}>Export</button>
                  <a href="/plans" style={{ marginLeft: 'auto', color: '#2563eb', textDecoration: 'none' }}>See Plans</a>
                  <a href="/about" style={{ marginLeft: 12, color: '#64748b', textDecoration: 'none' }}>About</a>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 800 }}>{domain ? ('Results for ' + domain) : 'Top contacts'}</div>
                <div style={{ color: '#64748b', fontSize: 13 }}>{domain ? ('Displaying ' + emails.length + ' of ' + total + ' results') : 'No contacts found yet.'}</div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={function () {}} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e6edf3', background: '#fff' }}>Export</button>
                <button onClick={clearSearch} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e6edf3', background: '#fff' }}>Clear</button>
              </div>
            </div>

            {loading && <div style={{ color: '#64748b' }}>Loading…</div>}
            {error && <div style={{ color: '#ef4444' }}>{error}</div>}

            {!loading && !error && emails.length === 0 && domain && (
              <div style={{ padding: 18, textAlign: 'center', color: '#64748b' }}>No public emails found (common for private companies)</div>
            )}

            <div style={{ display: 'grid', gap: 10 }}>
              {emails.map(function (e, i) {
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #eef2f7', padding: 12, borderRadius: 8 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                        { ((e.first_name || e.last_name) ? (( (e.first_name || '').charAt(0) + (e.last_name || '').charAt(0)).toUpperCase()) : 'C') }
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{((e.first_name || e.last_name) ? ((e.first_name || '') + ' ' + (e.last_name || '')).trim() : (e.email || ''))}</div>
                        <div style={{ color: '#64748b' }}>{e.position || ''} • <span>{ e.email ? <MaskedEmail email={e.email} /> : '' }</span></div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <a href={'https://www.google.com/search?q=' + encodeURIComponent(((e.first_name || '') + ' ' + (e.last_name || '')).trim() + ' ' + domain + ' site:linkedin.com')} target="_blank" rel="noreferrer">
                        <button style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e6edf3', background: '#fff' }}>Source</button>
                      </a>
                      <button style={{ padding: '8px 10px', borderRadius: 8, background: '#10b981', color: 'white', border: 'none' }}>Reveal</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 18, background: 'white', padding: 18, borderRadius: 12 }}>
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

          <div style={{ marginTop: 18, display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, background: 'white', padding: 18, borderRadius: 12 }}>
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
              <button style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#2563eb', color: 'white', border: 'none' }}>Sign Up</button>
            </div>
          </div>
        </section>

        <aside>
          <div style={{ background: 'white', padding: 16, borderRadius: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>C</div>
              <div>
                <div style={{ fontWeight: 800 }}>Company</div>
                <div style={{ color: '#64748b' }}>Meet Company: a scrappy team solving problems in surprisingly delightful ways.</div>
                <div style={{ marginTop: 8 }}>
                  <button style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e6edf3', background: '#fff', marginRight: 6 }}>Show more</button>
                  <button style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e6edf3', background: '#fff' }}>Regenerate</button>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', padding: 16, borderRadius: 12, marginBottom: 12 }}>
            <div style={{ fontWeight: 800 }}>Top contacts</div>
            <div style={{ color: '#64748b', marginTop: 8 }}>No contacts found yet.</div>
          </div>

          <div style={{ background: 'white', padding: 16, borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700 }}>View Results</div>
              <div style={{ color: '#64748b' }}>Export</div>
            </div>
            <div style={{ marginTop: 12 }}>
              <a href="/plans" style={{ color: '#2563eb' }}>See Plans</a>
            </div>
          </div>
        </aside>
      </main>

      <footer style={{ borderTop: '1px solid #e6edf3', marginTop: 28, padding: 20 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#64748b' }}>© 2025 NovaHunt. All rights reserved.</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <a href="/privacy" style={{ color: '#64748b', textDecoration: 'none' }}>Privacy</a>
            <a href="/terms" style={{ color: '#64748b', textDecoration: 'none' }}>Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
