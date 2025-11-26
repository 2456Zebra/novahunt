// components/CorporateProfile.jsx
import React from 'react';

export default function CorporateProfile({ domain, company }) {
  const name = (company && company.name) || domain || 'Unknown';
  const desc = (company && company.description) || 'No description available.';
  const website = domain ? `https://${domain}` : null;

  return (
    <div className="nh-card nh-corporate">
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: '0 0 72px' }}>
          <div className="nh-logo-badge">{name[0] || '?'}</div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{name}</div>
          <div className="nh-title" style={{ marginTop: 6 }}>{desc}</div>

          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            {website ? <a className="nh-btn nh-btn-outline" href={website} target="_blank" rel="noreferrer">Visit site</a> : <span className="nh-badge">No website</span>}
            <span className="nh-badge">Demo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
