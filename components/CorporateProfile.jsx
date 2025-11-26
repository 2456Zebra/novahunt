import React from 'react';

/**
 * CorporateProfile
 * Lightweight placeholder for a company profile.
 * Accepts props: { domain, company } — both optional.
 * Keep this simple to avoid runtime errors on client/server.
 */
export default function CorporateProfile({ domain, company }) {
  const displayName = (company && company.name) || domain || 'Unknown company';
  const description = (company && company.description) || 'No company description available.';
  const website = domain ? `https://${domain}` : null;

  return (
    <div className="nh-card" aria-label="Corporate profile">
      <div style={{ flex: '0 0 64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 12,
          background: 'linear-gradient(135deg,#FF4D7E,#7C3AED)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 22
        }}>
          {displayName[0] || '?'}
        </div>
      </div>

      <div style={{ marginLeft: 12, flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{displayName}</div>
        <div className="nh-title" style={{ marginTop: 6 }}>{description}</div>

        <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
          {website ? (
            <a className="nh-btn nh-btn-outline" href={website} target="_blank" rel="noreferrer">Visit site</a>
          ) : (
            <span className="nh-badge">No website</span>
          )}
          <span className="nh-badge">Data: demo</span>
        </div>
      </div>
    </div>
  );
}
