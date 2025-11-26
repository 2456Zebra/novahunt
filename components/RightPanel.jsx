// components/RightPanel.jsx
import React from 'react';
import dynamic from 'next/dynamic';

const CorporateProfile = dynamic(() => import('./CorporateProfile').catch(() => () => null), {
  ssr: false,
  loading: () => <div style={{ padding: 12 }}>Loading profile…</div>,
});

export default function RightPanel({ domain, company }) {
  if (!domain && !company) {
    return <aside className="nh-card nh-right-empty">Search a company to see a corporate profile.</aside>;
  }
  return (
    <aside className="nh-right-panel">
      <CorporateProfile domain={domain} company={company} />
    </aside>
  );
}
