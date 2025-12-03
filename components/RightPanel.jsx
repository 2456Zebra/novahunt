import React, { useEffect, useState } from 'react';

/*
  RightPanel — improved visual layout and Hunter/clearbit fallback for logos
  - Prefers company prop (company.logo, company.enrichment.image, company.total)
  - Shows: big logo, company title (only once), "Showing X of Y" line above the Upgrade CTA
  - Upgrade button text: "Upgrade to see all"
  - Website link moved to bottom-left below profile
  - Removes "source" label and small duplicate counts
*/

function readLocalCompany() {
  try {
    const raw = localStorage.getItem('nh_company');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function getClearbitLogo(domain) {
  try {
    if (!domain) return null;
    return `https://logo.clearbit.com/${domain}`;
  } catch (e) {
    return null;
  }
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
  const logoCandidate = (c && (c.logo || (c.enrichment && c.enrichment.image))) || null;
  const website = (c && (c.website || (c.domain ? `https://${c.domain}` : null))) || '';
  const shown = c && (typeof c.shown === 'number' ? c.shown : (c.contacts && c.contacts.length)) || 0;
  const total = c && (typeof c.total === 'number' ? c.total : null);

  // Determine final logo src: prefer explicit, then enrichment image, then Clearbit
  const logoSrc = logoCandidate || (domain ? getClearbitLogo(domain) : null);

  return (
    <aside aria-label="Company details" style={{ width: '100%', maxWidth: 320 }}>
      <div style={{ background: '#fff', border: '1px solid #e6edf3', borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 92, height: 92, borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', flexShrink: 0 }}>
            {logoSrc ? (
              // allow the browser to show clearbit or enrichment image
              <img src={logoSrc} alt={`${name} logo`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ fontSize: 40, color: '#6b7280', fontWeight: 700 }}>{(name && name[0]) || 'N'}</div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{name}</div>
            {/* Removed duplicate small domain line under title per request */}
          </div>
        </div>

        {/* Showing X of Y on one line above the upgrade CTA when a total is available */}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ color: '#6b7280', fontSize: 13 }}>
            {typeof total === 'number' && total > 0 ? (
              <span>Showing {shown} of {total}</span>
            ) : (
              <span>Showing {shown} result{shown !== 1 ? 's' : ''}</span>
            )}
          </div>

          <div>
            <a href="/plans" style={{ padding: '8px 12px', background: '#10b981', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>
              Upgrade to see all
            </a>
          </div>
        </div>

        <div style={{ marginTop: 12, color: '#374151', fontSize: 13, lineHeight: 1.4 }}>
          {description ? description : 'We don’t have a company description in our database yet.'}
        </div>

        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{shown}</div>
            <div style={{ color: '#6b7280', fontSize: 12 }}>{(typeof total === 'number' && total) ? `${total} total` : 'Total unknown'}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            {/* Placeholder for any small actions if needed */}
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
