import React from 'react';
import dynamic from 'next/dynamic';

const CorporateProfile = dynamic(() => import('./CorporateProfile').catch(() => () => null), {
  ssr: false,
  loading: () => <div style={{ padding: 12 }}>Loading profile…</div>,
});

/**
 * RightPanel
 * Renders a placeholder when no domain/company is provided.
 * Uses dynamic import for CorporateProfile so a missing file won't break the client.
 */
export default function RightPanel({ domain, company }) {
  if (!domain && !company) {
    return (
      <aside className="nh-rightpanel nh-rightpanel-empty" aria-label="Right panel placeholder">
        <div className="nh-placeholder">Search a company to see the Corporate Profile</div>
      </aside>
    );
  }

  return (
    <aside className="nh-rightpanel" aria-label="Right panel">
      <CorporateProfile domain={domain} company={company} />
    </aside>
  );
}
