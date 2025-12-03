import React, { useEffect, useState } from 'react';

/**
 * RightPanel — improved visuals
 * - Prefer `company` prop when supplied, fallback to nh_company in localStorage
 * - Shows logo, small site link, description, and a "source" link if available
 */

function readLocalCompany() {
  try {
    const raw = localStorage.getItem('nh_company');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

export default function RightPanel({ company }) {
  const [c, setC] = useState(company || null);

  useEffect(() => {
    if (company) {
      setC(company);
      return;
    }
    if (typeof window === 'undefined') return;
    const stored = readLocalCompany();
    if (stored) {
      setC(stored);
      return;
    }
    const lastDomain = localStorage.getItem('nh_lastDomain') || 'coca-cola.com';
    setC({ name: lastDomain, domain: lastDomain, description: '', website: `https://${lastDomain}` });
  }, [company]);

  const name = (c && (c.name || c.domain)) || 'coca-cola.com';
  const domain = (c && c.domain) || '';
  const description = (c && (c.description || (c.enrichment && c.enrichment.description))) || '';
  const logo = (c && (c.logo || (c.enrichment && c.enrichment.image))) || null;
  const website = (c && (c.website || (c.domain ? `https://${c.domain}` : null))) || '';

  return (
    <aside className="rp" aria-label="Company details" style={{ width: '100%', maxWidth: 320 }}>
      <div style={{ background: '#fff', border: '1px solid #e6edf3', borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
            {logo ? (
              <img src={logo} alt={`${name} logo`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ fontSize: 22, color: '#6b7280', fontWeight: 700 }}>{(name && name[0]) || 'N'}</div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{name}</div>
            <div style={{ color: '#6b7280', fontSize: 13 }}>{domain}</div>
          </div>
        </div>

        <div style={{ marginTop: 12, color: '#374151', fontSize: 13, lineHeight: 1.4 }}>
          {description ? description : 'No description available.'}
        </div>

        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            <div><strong style={{ fontWeight: 700 }}>{(c && (c.shown || (c.contacts && c.contacts.length))) || 0}</strong> shown</div>
            <div style={{ color: '#6b7280', fontSize: 12 }}>{(c && (c.total || (c.contacts && c.contacts.length))) || 0} total</div>
          </div>

          <div style={{ textAlign: 'right' }}>
            {website ? (
              <a href={website} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'underline', display: 'inline-block', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {website.replace(/^https?:\/\//, '')}
              </a>
            ) : null}
            {c && c.enrichment && c.enrichment.url ? (
              <div style={{ marginTop: 6 }}>
                <a href={c.enrichment.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#6b7280' }}>source</a>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}
