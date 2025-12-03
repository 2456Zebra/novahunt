// RightPanel: improved visual layout, larger logo and title, single domain display,
// removed "source" link, company website placed at bottom-left under profile.
import React, { useEffect, useState } from 'react';

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
    <aside aria-label="Company details" style={{ width: '100%', maxWidth: 320 }}>
      <div style={{ background: '#fff', border: '1px solid #e6edf3', borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 92, height: 92, borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', flexShrink: 0 }}>
            {logo ? (
              <img src={logo} alt={`${name} logo`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ fontSize: 40, color: '#6b7280', fontWeight: 700 }}>{(name && name[0]) || 'N'}</div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{name}</div>
            {/* show domain once (kept small) */}
            <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>{domain}</div>
          </div>
        </div>

        <div style={{ marginTop: 12, color: '#374151', fontSize: 13, lineHeight: 1.4 }}>
          {description ? description : 'We don’t have a company description in our database yet.'}
        </div>

        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{(c && (c.shown || (c.contacts && c.contacts.length))) || 0}</div>
            <div style={{ color: '#6b7280', fontSize: 12 }}>{(c && (c.total || (c.contacts && c.contacts.length))) || 0} total</div>
          </div>

          {/* small action area - keep compact */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            {/* Upgrade CTA */}
            <a href="/plans" style={{ padding: '6px 10px', background: '#10b981', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>Upgrade</a>
          </div>
        </div>

        {/* Company link at very bottom-left under profile */}
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-start' }}>
          {website ? (
            <a href={website} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
              {website.replace(/^https?:\/\//, '')}
            </a>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
